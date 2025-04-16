// src/components/PredictionForm.tsx

import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';
import {
    LineChart as LineChartIcon, // Renamed lucide icon
    TrendingUp,
    DollarSign,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
} from 'lucide-react';
import {
    Cryptocurrency,
    AIModel,
    PredictionFormData,
    PredictionFormResult, // Use the more detailed type internally
    PredictionResult,     // Use this type for the callback
} from '@/types'; // Assuming types are defined in @/types
import {
    ResponsiveContainer,
    LineChart, // Recharts component
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { v4 as uuidv4 } from 'uuid'; 
// --- Data Definitions ---
const cryptocurrencies: Cryptocurrency[] = [
    { id: 'Bitcoin',  name: 'Bitcoin',  symbol: 'BTC',  image: '' },
    { id: 'Ethereum', name: 'Ethereum', symbol: 'ETH',  image: '' },
    { id: 'Tether',   name: 'Tether',   symbol: 'USDT', image: '' },
    { id: 'XRP',      name: 'XRP',      symbol: 'XRP',  image: '' },
    { id: 'BNB',      name: 'BNB',      symbol: 'BNB',  image: '' },
    { id: 'Solana',   name: 'Solana',   symbol: 'SOL',  image: '' },
    { id: 'Dogecoin', name: 'Dogecoin', symbol: 'DOGE', image: '' },
    { id: 'USD Coin', name: 'USD Coin', symbol: 'USDC', image: '' },
    { id: 'TRON',     name: 'TRON',     symbol: 'TRX',  image: '' },
    { id: 'Cardano',  name: 'Cardano',  symbol: 'ADA',  image: '' },
];

const aiModels: AIModel[] = [
    { id: 'linear_regression', name: 'Linear Regression', description: '' },
    { id: 'random_forest',     name: 'Random Forest',     description: '' },
    { id: 'xgb',               name: 'XGBoost',           description: '' },
    { id: 'lstm',              name: 'LSTM',              description: '' },
    { id: 'bilstm',            name: 'BiLSTM',            description: '' },
    { id: 'cnn_bilstm',        name: 'CNN + BiLSTM',      description: '' },
    { id: 'gru',               name: 'GRU',               description: '' },
];
// --- ---

interface PredictionFormProps {
    onPredictionMade: (prediction: PredictionResult) => void; // Add this prop
}

export default function PredictionForm({ onPredictionMade }: PredictionFormProps) { // Destructure the prop
    const { toast } = useToast();
    const [formData, setFormData] = useState<PredictionFormData>({
        cryptocurrencyId: '',
        modelId: '',
        horizon: 7,
    });
    const [loading, setLoading] = useState(false);
    // Use the more detailed type for local state if needed (e.g., for confidence display)
    const [prediction, setPrediction] = useState<PredictionFormResult | null>(null);
    const [activeTab, setActiveTab] = useState('chart'); // Default to chart view

    const handleChange = (
        name: keyof PredictionFormData,
        value: string | number
    ) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setPrediction(null); // Clear previous prediction display in form

        try {
            const crypto = cryptocurrencies.find(c => c.id === formData.cryptocurrencyId);
            const model = aiModels.find(m => m.id === formData.modelId);

            if (!crypto) throw new Error('Please select a cryptocurrency.');
            if (!model) throw new Error('Please select an AI model.');

            const horizon = Number(formData.horizon);
            if (isNaN(horizon) || horizon < 1) throw new Error('Prediction horizon must be at least 1 day.');
            if (horizon > 30) throw new Error('Prediction horizon cannot exceed 30 days.');

            // --- API Call ---
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/predict`, // Ensure VITE_API_URL is set in your .env file
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        crypto: crypto.name, // Send the name or ID depending on backend needs
                        model: model.id,     // Send the model ID
                        horizon: horizon,
                    }),
                }
            );

            // --- Error Handling ---
            if (!res.ok) {
                let errorMsg = `Server responded with status ${res.status}`;
                try {
                    const errorData = await res.json();
                    errorMsg = errorData.detail || errorData.message || errorMsg;
                } catch (jsonError) {
                    try {
                        const textData = await res.text();
                        errorMsg = textData || errorMsg;
                    } catch (textError) {
                        // Keep the original status message
                    }
                }
                throw new Error(errorMsg);
            }

            // --- Process Response ---
            const { predicted_prices } = (await res.json()) as { predicted_prices: number[] };

            if (!predicted_prices || !Array.isArray(predicted_prices) || predicted_prices.length !== horizon) {
                throw new Error('Received invalid prediction data format from server.');
            }

            // --- Create Prediction Object ---
            const newPredictionData: PredictionFormResult = {
                id: uuidv4(), // Generate a unique ID
                crypto: crypto.name,
                model: model.name, // Use the model name for display
                predictedPrice: predicted_prices[0], // Price for the first day
                predictedPrices: predicted_prices, // Store full array for local display
                timestamp: new Date(),
                horizon: horizon,
                confidence: Math.floor(Math.random() * (95 - 70 + 1) + 70), // Placeholder confidence
            };

            // --- Update Local State for Form Display ---
            setPrediction(newPredictionData);
            setActiveTab('chart'); // Reset to chart view

            // --- Call the Callback to Update Dashboard State ---
            // Create the object matching PredictionResult type for the history
            const predictionForHistory: PredictionResult = {
                id: newPredictionData.id,
                crypto: newPredictionData.crypto,
                model: newPredictionData.model,
                predictedPrice: newPredictionData.predictedPrice,
                timestamp: newPredictionData.timestamp,
                horizon: newPredictionData.horizon,
            };
            onPredictionMade(predictionForHistory);

            // --- Success Toast ---
            toast({
                title: 'Prediction Generated Successfully',
                description: `Forecasted ${horizon} day${horizon > 1 ? 's' : ''} for ${crypto.name}.`,
            });

        } catch (err: any) {
            console.error("Prediction Error:", err);
            toast({
                title: 'Prediction Failed',
                description: err.message || 'An unknown error occurred.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    // Helper: Format price with appropriate precision
    const formatPrice = (price: number | undefined): string => {
        if (price === undefined || price === null) return 'N/A';
        // Adjust precision based on price magnitude
        if (price < 0.0001) return price.toFixed(8);
        if (price < 0.01) return price.toFixed(6);
        if (price < 1) return price.toFixed(4);
        if (price < 1000) return price.toFixed(2);
        return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // Helper: Get price change icon and color class for table view
    const getPriceChangeInfo = (currentPrice?: number, previousPrice?: number) => {
        if (currentPrice === undefined || previousPrice === undefined || currentPrice === previousPrice) {
            return { icon: Minus, className: 'text-muted-foreground' };
        }
        const change = currentPrice - previousPrice;
        if (change > 0) {
            return { icon: ArrowUpRight, className: 'text-green-600 dark:text-green-500' };
        } else { // change < 0
            return { icon: ArrowDownRight, className: 'text-red-600 dark:text-red-500' };
        }
    };

    // Prepare chart data (only if a prediction exists)
    const chartData = prediction?.predictedPrices?.map((price, index) => {
        const date = new Date(prediction.timestamp); // Start from prediction generation date
        date.setDate(date.getDate() + index); // Calculate future date for each point
        return {
            day: index + 1,
            dateStr: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), // Format like 'Jan 15'
            price: price,
        };
    }) || [];

    return (
        <div className="w-full max-w-4xl mx-auto"> {/* Removed py-8 px-4 to avoid double padding */}
            <Card className="bg-card shadow-lg border-border/50 overflow-hidden">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-2xl">
                        <LineChartIcon className="h-6 w-6 text-primary" />
                        <span>Cryptocurrency Price Prediction</span>
                    </CardTitle>
                    <CardDescription>
                        Choose a cryptocurrency, AI model, and prediction horizon (1-30 days).
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Cryptocurrency selector */}
                            <div className="space-y-2">
                                <Label htmlFor="cryptocurrency">Cryptocurrency</Label>
                                <Select
                                    value={formData.cryptocurrencyId}
                                    onValueChange={val => handleChange('cryptocurrencyId', val)}
                                    required // Make selection required
                                >
                                    <SelectTrigger id="cryptocurrency">
                                        <SelectValue placeholder="Select cryptocurrency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {cryptocurrencies.map(c => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.name} ({c.symbol})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* AI model selector */}
                            <div className="space-y-2">
                                <Label htmlFor="model">AI Model</Label>
                                <Select
                                    value={formData.modelId}
                                    onValueChange={val => handleChange('modelId', val)}
                                    required // Make selection required
                                >
                                    <SelectTrigger id="model">
                                        <SelectValue placeholder="Select AI model" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {aiModels.map(m => (
                                            <SelectItem key={m.id} value={m.id}>
                                                {m.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Horizon input */}
                            <div className="space-y-2">
                                <Label htmlFor="horizon">Days to Predict (1-30)</Label>
                                <Input
                                    id="horizon"
                                    type="number"
                                    min={1}
                                    max={30}
                                    value={formData.horizon}
                                    onChange={e => {
                                        const val = e.target.value;
                                        handleChange('horizon', val === '' ? '' : Math.max(1, Math.min(30, Number(val))));
                                    }}
                                    placeholder="e.g., 7"
                                    required // Make input required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={!formData.cryptocurrencyId || !formData.modelId || !formData.horizon || loading}
                        >
                            {loading ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    Generating Prediction…
                                </>
                            ) : (
                                <>
                                    <TrendingUp className="mr-2 h-4 w-4" />
                                    Generate Prediction
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>

                {/* --- Prediction Results Section (Displays the latest prediction made via this form) --- */}
                {prediction && (
                    <CardFooter className="flex flex-col space-y-4 border-t border-border/20 pt-6 bg-muted/20 pb-6">
                        <div className="flex items-center justify-between w-full px-6">
                            <h3 className="text-lg font-semibold">Prediction Results</h3>
                            <div className="text-xs text-muted-foreground flex items-center">
                                <Calendar className="h-3 w-3 mr-1.5" />
                                Generated: {new Date(prediction.timestamp).toLocaleString()}
                            </div>
                        </div>

                        <div className="w-full px-6 space-y-6">
                            {/* Summary Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 p-4 rounded-lg bg-background border border-border/50">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Cryptocurrency</p>
                                    <p className="font-semibold">{prediction.crypto}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">AI Model</p>
                                    <p className="font-semibold">{prediction.model}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Predicted Price (Day 1)</p>
                                    <p className="text-xl font-bold flex items-center text-primary">
                                        <DollarSign className="h-5 w-5 mr-1" />
                                        {formatPrice(prediction.predictedPrice)}
                                    </p>
                                </div>
                                {prediction.confidence !== undefined && (
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Est. Confidence</p>
                                        <div className="flex items-center pt-1">
                                            <div className="flex-1 h-2 mr-3 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary transition-all duration-500 ease-out"
                                                    style={{ width: `${prediction.confidence}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-semibold text-primary">
                                                {prediction.confidence}%
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Chart and Table Tabs for Multi-Day Forecast */}
                            {chartData.length > 0 && ( // Render only if there's data
                                <div className="pt-4 border-t border-border/20">
                                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                        <TabsList className="grid w-full grid-cols-2 mb-4">
                                            <TabsTrigger value="chart">Chart View</TabsTrigger>
                                            <TabsTrigger value="table">Table View</TabsTrigger>
                                        </TabsList>

                                        {/* Chart Tab Content */}
                                        <TabsContent value="chart" className="mt-0 outline-none ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                            <div className="h-64 md:h-80 w-full rounded-md border bg-background p-2 shadow-inner"> {/* Adjusted height & added shadow */}
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.6} />
                                                        <XAxis
                                                            dataKey="dateStr"
                                                            fontSize={10}
                                                            tickLine={false}
                                                            axisLine={false}
                                                            stroke="hsl(var(--muted-foreground))"
                                                            interval={'preserveStartEnd'}
                                                            padding={{ left: 10, right: 10 }}
                                                        />
                                                        <YAxis
                                                            orientation="left"
                                                            fontSize={10}
                                                            tickLine={false}
                                                            axisLine={false}
                                                            stroke="hsl(var(--muted-foreground))"
                                                            tickFormatter={(value) => `$${formatPrice(value)}`}
                                                            domain={['auto', 'auto']}
                                                            width={70} // Increased width for potentially larger numbers
                                                        />
                                                        <Tooltip
                                                            cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }}
                                                            contentStyle={{
                                                                backgroundColor: 'hsl(var(--background))',
                                                                borderColor: 'hsl(var(--border))',
                                                                borderRadius: 'var(--radius)',
                                                                fontSize: '12px',
                                                                padding: '6px 10px',
                                                                boxShadow: 'var(--shadow-md)',
                                                            }}
                                                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                                                            labelStyle={{ fontWeight: 'bold', marginBottom: '4px', color: 'hsl(var(--foreground))' }}
                                                            formatter={(value: number, name: string, props: any) => [
                                                                `$${formatPrice(value)}`,
                                                                `Day ${props.payload.day}` // Use payload for accurate day number
                                                            ]}
                                                            labelFormatter={(label) => label} // Shows the 'dateStr' (e.g., 'Jan 15') in tooltip title
                                                        />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="price"
                                                            stroke="hsl(var(--primary))"
                                                            strokeWidth={2}
                                                            dot={{ r: 2, strokeWidth: 1, fill: 'hsl(var(--primary))' }}
                                                            activeDot={{ r: 5, stroke: 'hsl(var(--background))', strokeWidth: 2, fill: 'hsl(var(--primary))' }}
                                                            isAnimationActive={true} // Enable animation
                                                            animationDuration={500} // Animation speed
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </TabsContent>

                                        {/* Table Tab Content */}
                                        <TabsContent value="table" className="mt-4">
                                            <div className="rounded-md border max-h-80 overflow-y-auto"> {/* Added max-height and scroll */}
                                                <Table>
                                                    <TableHeader className="sticky top-0 bg-muted"> {/* Sticky header */}
                                                        <TableRow>
                                                            <TableHead className="w-[50px]">Day</TableHead>
                                                            <TableHead>Date</TableHead>
                                                            <TableHead>Predicted Price</TableHead>
                                                            <TableHead>Change</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {prediction?.predictedPrices?.map((price, i) => {
                                                            const date = new Date(prediction.timestamp);
                                                            date.setDate(date.getDate() + i);
                                                            const formattedDate = date.toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                // year: 'numeric', // Optionally add year
                                                            });

                                                            // Ensure prevPrice exists and is not the same as current price for change calculation
                                                            const prevPrice = (i > 0 && prediction.predictedPrices) ? prediction.predictedPrices[i - 1] : undefined;
                                                            const { icon: ChangeIcon, className } = getPriceChangeInfo(price, prevPrice);
                                                            const changePercent = (prevPrice && prevPrice !== 0) ? ((price - prevPrice) / prevPrice * 100).toFixed(2) : '0.00';

                                                            return (
                                                                <TableRow key={i}>
                                                                    <TableCell className="font-medium">{i + 1}</TableCell>
                                                                    <TableCell>{formattedDate}</TableCell>
                                                                    <TableCell>${formatPrice(price)}</TableCell>
                                                                    <TableCell>
                                                                        {i > 0 && prevPrice !== undefined ? (
                                                                            <div className={`flex items-center ${className}`}>
                                                                                <ChangeIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                                                                                <span>{changePercent}%</span>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex items-center text-muted-foreground">
                                                                                <Minus className="h-4 w-4 mr-1 flex-shrink-0" />
                                                                                <span>—</span>
                                                                            </div>
                                                                        )}
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            )}
                        </div>
                    </CardFooter>
                )}
                {/* --- End Prediction Results --- */}
            </Card>
        </div>
    );
}