"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, Calendar, CreditCard, Mail, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

interface PurchaseRecord {
  id: string;
  stripeSessionId: string;
  stripePaymentIntentId: string;
  userEmail: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: any;
  metadata?: {
    productName?: string;
    description?: string;
    paymentMethod?: string;
  };
  stripeData?: {
    customerDetails?: {
      name?: string;
    };
  };
}

export default function SuccessPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch purchase history
  useEffect(() => {
    const fetchPurchaseHistory = async () => {
      if (!user?.email) {
        setLoadingPurchases(false);
        return;
      }

      try {
        setLoadingPurchases(true);
        setError(null);

        // Query purchases for the authenticated user
        const purchasesQuery = query(
          collection(db, 'purchases'),
          where('userEmail', '==', user.email),
          orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(purchasesQuery);
        const purchaseData: PurchaseRecord[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          purchaseData.push({
            id: doc.id,
            ...data,
          } as PurchaseRecord);
        });

        setPurchases(purchaseData);
      } catch (error: any) {
        console.error('Error fetching purchase history:', error);
        setError('Failed to load purchase history. Please try refreshing the page.');
      } finally {
        setLoadingPurchases(false);
      }
    };

    if (user?.email) {
      fetchPurchaseHistory();
    }
  }, [user?.email]);

  // Format currency for display
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency || 'AUD',
    }).format(amount / 100);
  };

  // Format date for display
  const formatDate = (timestamp: any) => {
    let date: Date;
    
    if (timestamp?.toDate) {
      // Firestore Timestamp
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      return 'Unknown date';
    }

    return new Intl.DateTimeFormat('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Show loading state
  if (loading || !user) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your payment information...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="text-3xl font-headline font-bold text-foreground mb-2">
            Payment Successful!
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            Thank you for your purchase, {user.name1}! Your payment has been processed successfully.
          </p>
          <p className="text-sm text-muted-foreground">
            A confirmation email has been sent to <strong>{user.email}</strong>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button asChild size="lg">
            <Link href="/dashboard">
              <ArrowRight className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/">
              Return to Home
            </Link>
          </Button>
        </div>

        <Separator className="mb-8" />

        {/* Purchase History Section */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-headline font-semibold text-foreground mb-2">
              Your Purchase History
            </h2>
            <p className="text-muted-foreground">
              Here are all your completed transactions with Wedly
            </p>
          </div>

          {/* Loading State */}
          {loadingPurchases && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading purchase history...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="text-center text-destructive">
                  <p>{error}</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => window.location.reload()}
                  >
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Purchase History */}
          {!loadingPurchases && !error && (
            <>
              {purchases.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">
                      <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No purchase history found.</p>
                      <p className="text-sm mt-2">
                        Your transactions will appear here once they are processed.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {purchases.map((purchase) => (
                    <Card key={purchase.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">
                              {purchase.metadata?.productName || 'Wedly Service'}
                            </CardTitle>
                            <CardDescription>
                              {purchase.metadata?.description || 'One-time payment for Wedly service access'}
                            </CardDescription>
                          </div>
                          <Badge 
                            variant={purchase.status === 'completed' ? 'default' : 'secondary'}
                            className="ml-4"
                          >
                            {purchase.status === 'completed' ? 'Completed' : purchase.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Amount</p>
                              <p className="text-muted-foreground">
                                {formatCurrency(purchase.amount, purchase.currency)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Date</p>
                              <p className="text-muted-foreground">
                                {formatDate(purchase.createdAt)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Transaction ID</p>
                              <p className="text-muted-foreground font-mono text-xs">
                                {purchase.stripeSessionId.substring(0, 20)}...
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {purchase.stripeData?.customerDetails?.name && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-sm text-muted-foreground">
                              <strong>Customer:</strong> {purchase.stripeData.customerDetails.name}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}