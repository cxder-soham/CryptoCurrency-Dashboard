// src/pages/Home.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import PredictionForm from '@/components/PredictionForm';
import { Card, CardContent } from '@/components/ui/card';
import { LineChart, TrendingUp, Award, Zap } from 'lucide-react';

const Home = () => {
  return (
    <Layout>
      <section className="py-12 md:py-20 px-4 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Predict Cryptocurrency Prices with{' '}
                <span className="text-primary">AI</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Leverage advanced machine learning models to forecast cryptocurrency market trends and make data-driven investment decisions.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <div className="inline-flex items-center text-sm text-muted-foreground bg-muted/40 rounded-full px-4 py-1">
                  <Award className="h-4 w-4 mr-2 text-primary" />
                  <span>Advanced AI Models</span>
                </div>
                <div className="inline-flex items-center text-sm text-muted-foreground bg-muted/40 rounded-full px-4 py-1">
                  <Zap className="h-4 w-4 mr-2 text-accent" />
                  <span>Real-time Analysis</span>
                </div>
                <div className="inline-flex items-center text-sm text-muted-foreground bg-muted/40 rounded-full px-4 py-1">
                  <TrendingUp className="h-4 w-4 mr-2 text-secondary" />
                  <span>Market Predictions</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 blur-3xl opacity-20 rounded-full" />
              <Card className="overflow-hidden border-border/50 relative z-10">
                <CardContent className="p-0">
                  <div className="p-6 text-center uppercase border-b border-border/20">
                    <div className="flex justify-center pb-2">
                      <LineChart className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold">Crypto Price Predictor</h2>
                  </div>
                  <div className="p-6">
                    <PredictionForm />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/10">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our platform uses cutting-edge AI algorithms to analyze market data and predict future cryptocurrency prices
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <LineChart className="h-8 w-8 text-primary" />,
                title: "Data Collection",
                description: "We gather historical price data, market indicators, and sentiment analysis from multiple sources."
              },
              {
                icon: <Zap className="h-8 w-8 text-accent" />,
                title: "AI Processing",
                description: "Our advanced AI models process and analyze the data to identify patterns and trends."
              },
              {
                icon: <TrendingUp className="h-8 w-8 text-secondary" />,
                title: "Price Prediction",
                description: "The AI generates price predictions with confidence levels to help inform your decisions."
              }
            ].map((item, index) => (
              <Card key={index} className="bg-card border-border/50 h-full">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="h-16 w-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                      {item.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Home;
