# backend/main.py

import os
from typing import Literal, List
import numpy as np
import joblib
import pandas as pd
import torch
import torch.nn as nn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from xgboost import XGBRegressor
from fastapi.middleware.cors import CORSMiddleware
# ----------------------------
# 1. Configuration & Constants
# ----------------------------
DATA_DIR = "data"
MODELS_DIR = "saved_models"
WINDOW_SIZE = 30  # number of days used as input

CRYPTO_FILES = {
    "Bitcoin":    "Bitcoin_data.csv",
    "Ethereum":   "Ethereum_data.csv",
    "Tether":     "Tether_data.csv",
    "XRP":        "XRP_data.csv",
    "BNB":        "BNB_data.csv",
    "Solana":     "Solana_data.csv",
    "Dogecoin":   "Dogecoin_data.csv",
    "USD Coin":   "USD_Coin_data.csv",
    "TRON":       "TRON_data.csv",
    "Cardano":    "Cardano_data.csv",
}

ModelKey = Literal[
    "linear_regression",
    "random_forest",
    "xgb",
    "lstm",
    "bilstm",
    "cnn_bilstm",
    "gru",
]

# ----------------------------
# 2. Load Scaler & sklearn/XGB
# ----------------------------
scaler = joblib.load(os.path.join(MODELS_DIR, "minmax_scaler.joblib"))
lr_model = joblib.load(os.path.join(MODELS_DIR, "linear_regression.joblib"))
rf_model = joblib.load(os.path.join(MODELS_DIR, "random_forest.joblib"))
xgb_model = XGBRegressor()
xgb_model.load_model(os.path.join(MODELS_DIR, "xgb_best.json"))

# ----------------------------
# 3. Define PyTorch Models
# ----------------------------


class LSTMRegressor(nn.Module):
    def __init__(self, input_size=1, hidden_size=50, num_layers=2, output_size=1, dropout=0.2):
        super().__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers,
                            batch_first=True, dropout=dropout)
        self.fc = nn.Linear(hidden_size, output_size)

    def forward(self, x):
        h0 = torch.zeros(self.num_layers,  x.size(
            0), self.hidden_size, device=x.device)
        c0 = torch.zeros(self.num_layers,  x.size(
            0), self.hidden_size, device=x.device)
        out, _ = self.lstm(x, (h0, c0))
        return self.fc(out[:, -1, :])


class BiLSTMRegressor(nn.Module):
    def __init__(self, input_size=1, hidden_size=50, num_layers=2, output_size=1, dropout=0.2):
        super().__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers,
                            batch_first=True, dropout=dropout, bidirectional=True)
        self.fc = nn.Linear(hidden_size * 2, output_size)

    def forward(self, x):
        num_d = 2
        h0 = torch.zeros(self.num_layers * num_d, x.size(0),
                         self.hidden_size, device=x.device)
        c0 = torch.zeros(self.num_layers * num_d, x.size(0),
                         self.hidden_size, device=x.device)
        out, _ = self.lstm(x, (h0, c0))
        return self.fc(out[:, -1, :])


class CNN_BiLSTM(nn.Module):
    def __init__(self, cnn_out_channels=64, kernel_size=3, hidden_size=50, num_layers=2, dropout=0.2):
        super().__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.cnn = nn.Conv1d(1, cnn_out_channels,
                             kernel_size, padding=kernel_size//2)
        self.bilstm = nn.LSTM(cnn_out_channels, hidden_size, num_layers,
                              batch_first=True, dropout=dropout, bidirectional=True)
        self.fc = nn.Linear(hidden_size * 2, 1)

    def forward(self, x):
        # x: (batch, seq_len, features)
        x = x.permute(0, 2, 1)             # → (batch, features, seq_len)
        x = torch.relu(self.cnn(x))     # → (batch, cnn_out_channels, seq_len)
        # → (batch, seq_len, cnn_out_channels)
        x = x.permute(0, 2, 1)
        num_d = 2
        h0 = torch.zeros(self.num_layers * num_d, x.size(0),
                         self.hidden_size, device=x.device)
        c0 = torch.zeros(self.num_layers * num_d, x.size(0),
                         self.hidden_size, device=x.device)
        out, _ = self.bilstm(x, (h0, c0))
        return self.fc(out[:, -1, :])


class GRURegressor(nn.Module):
    def __init__(self, input_size=1, hidden_size=50, num_layers=2, output_size=1, dropout=0.2):
        super().__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.gru = nn.GRU(input_size, hidden_size, num_layers,
                          batch_first=True, dropout=dropout)
        self.fc = nn.Linear(hidden_size, output_size)

    def forward(self, x):
        h0 = torch.zeros(self.num_layers, x.size(
            0), self.hidden_size, device=x.device)
        out, _ = self.gru(x, h0)
        return self.fc(out[:, -1, :])

# ----------------------------
# 4. Instantiate & Load PyTorch
# ----------------------------


def load_pt_model(cls, fname):
    m = cls()
    m.load_state_dict(torch.load(os.path.join(MODELS_DIR, fname)))
    m.eval()
    return m


lstm_model = load_pt_model(LSTMRegressor,    "lstm_model.pth")
bilstm_model = load_pt_model(BiLSTMRegressor,  "bilstm_model.pth")
cnn_model = load_pt_model(CNN_BiLSTM,       "cnn_bilstm_model.pth")
gru_model = load_pt_model(GRURegressor,     "gru_model.pth")

MODEL_DISPATCH = {
    "linear_regression": lr_model,
    "random_forest":     rf_model,
    "xgb":               xgb_model,
    "lstm":              lstm_model,
    "bilstm":            bilstm_model,
    "cnn_bilstm":        cnn_model,
    "gru":               gru_model,
}




# ----------------------------
# 5. FastAPI App & Schemas
# ----------------------------
app = FastAPI()


# ---- CORS setup ----
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictRequest(BaseModel):
    crypto: Literal[tuple(CRYPTO_FILES.keys())]
    model:  ModelKey
    horizon: int = 1


class PredictResponse(BaseModel):
    predicted_prices: List[float]

# ----------------------------
# 6. Data helper
# ----------------------------


def get_last_window(crypto: str):
    path = os.path.join(DATA_DIR, CRYPTO_FILES[crypto])
    df = pd.read_csv(path, parse_dates=["Date"], index_col="Date")
    w = df["Close"].dropna().values[-WINDOW_SIZE:]
    if len(w) < WINDOW_SIZE:
        raise HTTPException(400, f"Not enough data for {crypto}")
    return scaler.transform(w.reshape(-1, 1)).flatten()

# ----------------------------
# 7. Prediction Endpoint
# ----------------------------


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    model = MODEL_DISPATCH[req.model]
    window = get_last_window(req.crypto)
    preds = []
    for _ in range(req.horizon):
        if req.model in ("linear_regression", "random_forest", "xgb"):
            X = window.reshape(1, -1)
            y_s = model.predict(X)[0]
        else:
            X = torch.from_numpy(window).float().unsqueeze(0).unsqueeze(-1)
            with torch.no_grad():
                y_s = model(X).cpu().numpy()[0, 0]
        # inverse scale
        y = scaler.inverse_transform([[y_s]])[0, 0]
        preds.append(float(y))
        # append scaled prediction for next step
        y_s_scaled = y_s
        window = np.append(window[1:], y_s_scaled)
    return PredictResponse(predicted_prices=preds)
