// src/pages/Dashboard.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    LineChart,
    TrendingUp,
    History,
    Settings,
    DollarSign,
    ChevronUp,
    ChevronDown,
    ArrowUpRight,
    Bell,
    Plus,
    Star,
    BarChart3 // Keep if used elsewhere, otherwise remove
} from 'lucide-react';
import PredictionForm from '@/components/PredictionForm';
import { PredictionResult } from '@/types'; // Import the shared type

// Mock market data (keep if using static data)
const marketSummary = [
    { crypto: 'Bitcoin', price: 32150.73, change: 2.5, volume: '3.2B', marketCap: '621.3B' },
    { crypto: 'Ethereum', price: 1850.42, change: -1.2, volume: '1.5B', marketCap: '219.7B' },
    { crypto: 'Cardano', price: 0.42, change: 5.7, volume: '320M', marketCap: '14.2B' },
    { crypto: 'Solana', price: 42.5, change: 8.1, volume: '850M', marketCap: '18.5B' },
    { crypto: 'Ripple', price: 0.56, change: -3.2, volume: '430M', marketCap: '29.7B' },
];

const Dashboard = () => {
    const navigate = useNavigate();
    const { state } = useAuth();
    const { isAuthenticated, user, loading } = state;
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('overview');

    // *** State for all predictions ***
    const [allPredictions, setAllPredictions] = useState<PredictionResult[]>([]);
    const [showAllHistory, setShowAllHistory] = useState(false); // For "Load More" / "Show Less"
    const HISTORY_PREVIEW_COUNT = 5; // Number of items to show initially in history tab

    // *** Load predictions from localStorage on mount ***
    useEffect(() => {
        const storedPredictions = localStorage.getItem('cryptoPredictions');
        if (storedPredictions) {
            try {
                const parsedPredictions: PredictionResult[] = JSON.parse(storedPredictions);
                // Ensure timestamps are Date objects after parsing
                setAllPredictions(parsedPredictions.map(p => ({
                    ...p,
                    timestamp: new Date(p.timestamp) // Convert string back to Date
                })).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())); // Sort newest first
            } catch (error) {
                console.error("Failed to parse predictions from localStorage", error);
                localStorage.removeItem('cryptoPredictions'); // Clear invalid data
            }
        }
    }, []); // Empty dependency array ensures this runs only once on mount

    // *** Save predictions to localStorage whenever they change ***
    useEffect(() => {
        // Check if allPredictions is not empty before saving to avoid overwriting loaded data with initial empty state
        if (allPredictions.length > 0 || localStorage.getItem('cryptoPredictions')) {
             localStorage.setItem('cryptoPredictions', JSON.stringify(allPredictions));
        }
    }, [allPredictions]);

    // *** Auth check and redirect ***
    useEffect(() => {
        if (!loading && !isAuthenticated) {
            toast({
                title: 'Access Denied',
                description: 'Please log in to access the dashboard.',
                variant: 'destructive',
            });
            navigate('/login');
        }
    }, [isAuthenticated, loading, navigate, toast]);


    // *** Handler function to add a new prediction ***
    const handleNewPrediction = (newPrediction: PredictionResult) => {
        setAllPredictions(prevPredictions =>
            [newPrediction, ...prevPredictions] // Add to the start (newest first)
             .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()) // Ensure sorting
        );
         // Optional: Switch to predictions tab after prediction if desired
         // setActiveTab('predictions');
    };

    // --- Loading/Auth check ---
    if (loading) {
        return (
            <Layout>
                <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
            </Layout>
        );
    }
    if (!isAuthenticated) {
        return null; // Redirect happens via useEffect
    }

    // Prepare data for display (sort handled in state updates)
    const recentPredictionsForOverview = allPredictions.slice(0, 4);
    const displayedHistory = showAllHistory ? allPredictions : allPredictions.slice(0, HISTORY_PREVIEW_COUNT);

    // Helper function to format price (could be moved to a utils file)
    const formatPrice = (price: number): string => {
        if (price === undefined || price === null) return 'N/A';
        if (price < 0.01) return price.toFixed(6);
        if (price < 1) return price.toFixed(4);
        return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // Calculate simple stats (replace with more robust logic if needed)
    const totalPredictions = allPredictions.length;
    // Favorite model calculation (example - needs refinement)
    const modelCounts = allPredictions.reduce((acc, p) => {
        acc[p.model] = (acc[p.model] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const favoriteModel = Object.entries(modelCounts).sort(([,a], [,b]) => b-a)[0]?.[0] || 'N/A';
    const favoriteModelCount = modelCounts[favoriteModel] || 0;


    return (
        <Layout>
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Dashboard</h1>
                        <p className="text-muted-foreground">Welcome back, {user?.name}</p>
                    </div>
                    {/* Add other header elements like Notifications or Settings if needed */}
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList className="grid grid-cols-3 md:w-[400px] w-full">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="predictions">Predictions</TabsTrigger>
                        <TabsTrigger value="market">Market</TabsTrigger>
                    </TabsList>

                    {/* --- Overview Tab --- */}
                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Card className="bg-card border-border/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium">Total Predictions</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{totalPredictions}</div>
                                    {/* Placeholder for change metric */}
                                    <p className="text-xs text-muted-foreground">Your prediction count</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-card border-border/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium">Average Accuracy</CardTitle>
                                </CardHeader>
                                <CardContent>
                                     {/* Accuracy requires actual prices - implement later */}
                                    <div className="text-2xl font-bold">N/A</div>
                                    <p className="text-xs text-muted-foreground">Requires actual price data</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-card border-border/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium">Favorite Model</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold truncate">{favoriteModel}</div>
                                    <p className="text-xs text-muted-foreground">
                                        Used in {favoriteModelCount} prediction{favoriteModelCount !== 1 ? 's' : ''}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recent Predictions Card */}
                        <Card className="bg-card border-border/50">
                            <CardHeader>
                                <CardTitle>Recent Predictions</CardTitle>
                                <CardDescription>Your latest cryptocurrency price predictions</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {recentPredictionsForOverview.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-4">No predictions made yet. Make one in the 'Predictions' tab!</p>
                                ) : (
                                    <div className="space-y-6">
                                        {recentPredictionsForOverview.map((prediction) => (
                                            <div key={prediction.id} className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-border/20 last:border-0 last:pb-0">
                                                <div className="space-y-1 mb-2 md:mb-0">
                                                    <div className="font-medium">{prediction.crypto}</div>
                                                    <div className="flex items-center text-sm text-muted-foreground flex-wrap gap-x-4 gap-y-1">
                                                        <div className="flex items-center">
                                                            <LineChart className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                                                            {prediction.model}
                                                        </div>
                                                        <div className="flex items-center">
                                                            <History className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                                                            {new Date(prediction.timestamp).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-4 sm:space-x-6 mt-2 md:mt-0 text-right">
                                                    <div className="min-w-[90px]">
                                                        <div className="text-sm text-muted-foreground">Predicted (Day 1)</div>
                                                        <div className="font-medium">${formatPrice(prediction.predictedPrice)}</div>
                                                    </div>
                                                    <div className="min-w-[70px]">
                                                        <div className="text-sm text-muted-foreground">Horizon</div>
                                                        <div className="font-medium">{prediction.horizon} Day{prediction.horizon > 1 ? 's' : ''}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                            {allPredictions.length > recentPredictionsForOverview.length && (
                                <CardFooter>
                                    <Button variant="outline" className="w-full" onClick={() => setActiveTab('predictions')}>
                                        View All Predictions
                                    </Button>
                                </CardFooter>
                            )}
                        </Card>

                        {/* Market Summary Card */}
                        <Card className="bg-card border-border/50">
                            <CardHeader>
                                <CardTitle>Market Summary</CardTitle>
                                <CardDescription>Current prices for top cryptocurrencies (Mock Data)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[600px]"> {/* Added min-width */}
                                        <thead>
                                            <tr className="text-left text-muted-foreground text-sm border-b border-border/20">
                                                <th className="pb-3 pl-2 font-medium">Cryptocurrency</th>
                                                <th className="pb-3 font-medium">Price</th>
                                                <th className="pb-3 font-medium">24h Change</th>
                                                <th className="pb-3 font-medium">Volume (24h)</th>
                                                <th className="pb-3 pr-2 font-medium">Market Cap</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {marketSummary.map((crypto, index) => (
                                                <tr key={index} className="border-b border-border/10 last:border-0 hover:bg-muted/50">
                                                    <td className="py-3 pl-2 font-medium">{crypto.crypto}</td>
                                                    <td className="py-3">${crypto.price.toLocaleString()}</td>
                                                    <td className="py-3">
                                                        <span className={`flex items-center ${crypto.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                            {crypto.change >= 0 ? (
                                                                <ChevronUp className="h-4 w-4 mr-1 flex-shrink-0" />
                                                            ) : (
                                                                <ChevronDown className="h-4 w-4 mr-1 flex-shrink-0" />
                                                            )}
                                                            {Math.abs(crypto.change)}%
                                                        </span>
                                                    </td>
                                                    <td className="py-3">${crypto.volume}</td>
                                                    <td className="py-3 pr-2">${crypto.marketCap}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                             {/* Optional: Add footer link to full market page */}
                             {/* <CardFooter>
                                <Button variant="link" className="p-0 h-auto text-primary">See full market</Button>
                             </CardFooter> */}
                        </Card>
                    </TabsContent>

                    {/* --- Predictions Tab --- */}
                    <TabsContent value="predictions" className="space-y-6">
                        {/* Prediction Form Card */}
                        <Card className="bg-card border-border/50">
                            <CardHeader>
                                <CardTitle>New Prediction</CardTitle>
                                <CardDescription>Generate a new forecast using available AI models</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {/* Pass the handler function */}
                                <PredictionForm onPredictionMade={handleNewPrediction} />
                            </CardContent>
                        </Card>

                        {/* Prediction History Card */}
                        <Card className="bg-card border-border/50">
                            <CardHeader>
                                <CardTitle>Prediction History</CardTitle>
                                <CardDescription>All your past cryptocurrency price predictions</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {allPredictions.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-4">Your prediction history will appear here.</p>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Use displayedHistory for pagination/load more */}
                                        {displayedHistory.map((prediction) => (
                                             <div key={prediction.id} className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-border/20 last:border-0 last:pb-0">
                                                <div className="space-y-1 mb-2 md:mb-0">
                                                    <div className="font-medium">{prediction.crypto}</div>
                                                    <div className="flex items-center text-sm text-muted-foreground flex-wrap gap-x-4 gap-y-1">
                                                        <div className="flex items-center">
                                                            <LineChart className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                                                            {prediction.model}
                                                        </div>
                                                        <div className="flex items-center">
                                                            <History className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                                                            {new Date(prediction.timestamp).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-4 sm:space-x-6 mt-2 md:mt-0 text-right">
                                                    <div className="min-w-[90px]">
                                                        <div className="text-sm text-muted-foreground">Predicted (Day 1)</div>
                                                        <div className="font-medium">${formatPrice(prediction.predictedPrice)}</div>
                                                    </div>
                                                    <div className="min-w-[70px]">
                                                        <div className="text-sm text-muted-foreground">Horizon</div>
                                                        <div className="font-medium">{prediction.horizon} Day{prediction.horizon > 1 ? 's' : ''}</div>
                                                    </div>
                                                    {/* Removed Actual & Accuracy */}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                            {/* "Load More" / "Show Less" Button */}
                            {allPredictions.length > HISTORY_PREVIEW_COUNT && (
                                <CardFooter>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => setShowAllHistory(!showAllHistory)}
                                    >
                                        {showAllHistory ? 'Show Less' : `Show More (${allPredictions.length - HISTORY_PREVIEW_COUNT} more)`}
                                    </Button>
                                </CardFooter>
                            )}
                        </Card>
                    </TabsContent>

                    {/* --- Market Tab --- */}
                    <TabsContent value="market" className="space-y-6">
                         {/* Using mock data here - replace with live data source if needed */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {marketSummary.slice(0, 4).map((crypto, index) => (
                                <Card key={index} className="bg-card border-border/50 hover:shadow-md transition-shadow duration-200">
                                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                                        <CardTitle className="text-base font-medium">
                                            {crypto.crypto}
                                        </CardTitle>
                                        {/* Placeholder for crypto icon */}
                                        {/* <img src={crypto.image || '/placeholder-icon.png'} alt={crypto.crypto} className="h-6 w-6"/> */}
                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">${crypto.price.toLocaleString()}</div>
                                        <div className={`flex items-center text-sm ${crypto.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {crypto.change >= 0 ? (
                                                <ArrowUpRight className="h-4 w-4 mr-1" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4 mr-1" /> // Using ChevronDown for consistency
                                            )}
                                            {Math.abs(crypto.change)}%
                                            <span className="text-xs text-muted-foreground ml-1">(24h)</span>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="pt-0">
                                        {/* Example Button - implement functionality if needed */}
                                        <Button variant="ghost" size="sm" className="flex items-center text-xs text-muted-foreground hover:text-primary">
                                            <Star className="h-3.5 w-3.5 mr-1.5" />
                                            Add to Watchlist
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                         {/* Optional: Link to a full market page */}
                        <div className="text-center">
                           <Button variant="link" onClick={() => alert('Navigate to full market page (not implemented)')}>
                                View Full Market Data
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </Layout>
    );
};

export default Dashboard;