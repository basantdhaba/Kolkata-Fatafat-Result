import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { updateGameResult } from '@/lib/firebase/results/update';
import { Loader2 } from "lucide-react";

interface ResultFormData {
  gameId: string;
  roundNumber: number;
  result: string;
}

const ResultForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const form = useForm<ResultFormData>({
    defaultValues: {
      gameId: '',
      roundNumber: 1,
      result: ''
    }
  });

  const onSubmit = async (data: ResultFormData) => {
    setIsLoading(true);
    try {
      console.log('Submitting result:', data);
      
      // Validate result format (should be a number)
      if (!/^\d+$/.test(data.result)) {
        toast.error('Result must be a number');
        return;
      }

      // Convert roundNumber to number if it's a string
      const roundNum = Number(data.roundNumber);
      if (isNaN(roundNum)) {
        toast.error('Invalid round number');
        return;
      }

      const response = await updateGameResult(
        data.gameId,
        roundNum,
        data.result
      );

      if (response.success) {
        toast.success('Result updated successfully');
        setLastResult(data.result);
        // Reset only the result field
        form.reset({
          ...data,
          result: ''
        });
      } else {
        toast.error(`Failed to update result: ${response.error}`);
      }
    } catch (error) {
      console.error('Error submitting result:', error);
      toast.error('An error occurred while updating the result');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Update Game Result</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="gameId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Game ID</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="roundNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Round Number</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number" 
                      min={1} 
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="result"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Result</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Result'
              )}
            </Button>

            {lastResult && (
              <div className="mt-4 p-2 bg-green-50 dark:bg-green-900 rounded">
                <p className="text-sm text-green-600 dark:text-green-200">
                  Last Updated Result: {lastResult}
                </p>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ResultForm;
