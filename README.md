# CryptoCurrency Dashboard

A full-stack application for cryptocurrency price prediction using AI models and real-time market data analysis.

## Project Overview

CryptoCurrency Dashboard combines a modern React frontend with a Python backend to provide cryptocurrency price predictions using various machine learning models. The system analyzes historical data and provides predictions for major cryptocurrencies including Bitcoin, Ethereum, and others.

## Features

- Real-time cryptocurrency price tracking
- Advanced AI-powered price predictions using multiple models:
  - Linear Regression
  - Random Forest
  - XGBoost
  - LSTM
  - BiLSTM
  - CNN+BiLSTM
  - GRU
- Interactive dashboards and visualizations
- User authentication system
- Responsive design for all devices

## Tech Stack

### Frontend
- React + TypeScript
- Tailwind CSS
- Shadcn UI Components
- React Router
- TanStack Query
- Recharts for data visualization

### Backend
- Python
- PyTorch for deep learning models
- Scikit-learn for ML models
- Pandas for data processing
- Matplotlib for plotting
- Yahoo Finance API for market data

## Setup

### Backend Setup
```sh
cd crypto_backend
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend Setup
```sh
cd crypto_frontend
npm install
npm run dev
```

## Project Structure

```
├── crypto_backend/
│   ├── data/               # Cryptocurrency historical data
│   ├── saved_models/       # Trained ML models
│   ├── main.ipynb         # Main ML pipeline
│   └── requirements.txt
│
├── crypto_frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/        # Page components
│   │   ├── contexts/     # React contexts
│   │   └── lib/         # Utility functions
│   ├── public/          # Static assets
│   └── package.json
```

## Model Performance

Based on our evaluation metrics:

| Model              | MSE       | R2 Score |
|-------------------|-----------|----------|
| Linear Regression | 2.72e+06  | 0.995427 |
| BiLSTM            | 4.17e+06  | 0.992988 |
| GRU               | 6.15e+06  | 0.989668 |
| LSTM              | 1.72e+07  | 0.971142 |
| CNN+BiLSTM        | 5.47e+07  | 0.908094 |
| Random Forest     | 1.80e+08  | 0.697737 |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details

## Acknowledgments

- Data provided by Yahoo Finance API
- UI components from Shadcn UI
- Machine learning implementations inspired by PyTorch examples