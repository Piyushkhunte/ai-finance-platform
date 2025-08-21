"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import useFetch from "@/hooks/use-fetch";
// Removed toast import if you don’t want popups

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import { cn } from "@/lib/utils";
import { createTransaction, updateTransaction } from "@/app/actions/transaction";
import { transactionSchema } from "@/app/lib/schema";
import { ReceiptScanner } from "./recipt-scanner";

export function AddTransactionForm({ accounts, categories, editMode = false, initialData = null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [mounted, setMounted] = useState(false); // ensures client-only rendering
  useEffect(() => setMounted(true), []);

  const { register, handleSubmit, formState: { errors }, watch, setValue, getValues, reset } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: editMode && initialData ? {
      type: initialData.type,
      amount: initialData.amount.toString(),
      description: initialData.description,
      accountId: initialData.accountId,
      category: initialData.category,
      date: new Date(initialData.date),
      isRecurring: initialData.isRecurring,
      ...(initialData.recurringInterval && { recurringInterval: initialData.recurringInterval }),
    } : {
      type: "EXPENSE",
      amount: "",
      description: "",
      accountId: accounts.find((ac) => ac.isDefault)?.id || "",
      date: new Date(),
      isRecurring: false,
    },
  });

  const { loading: transactionLoading, fn: transactionFn, data: transactionResult } = useFetch(editMode ? updateTransaction : createTransaction);

  const onSubmit = (data) => {
    const formData = { ...data, amount: parseFloat(data.amount) };
    if (editMode) transactionFn(editId, formData);
    else transactionFn(formData);
  };

  const handleScanComplete = (scannedData) => {
    if (!scannedData) return;
    setValue("amount", scannedData.amount.toString());
    setValue("date", new Date(scannedData.date));
    if (scannedData.description) setValue("description", scannedData.description);
    if (scannedData.category) setValue("category", scannedData.category);
    // toast removed
  };

  useEffect(() => {
    if (!mounted) return;
    if (transactionResult?.success && !transactionLoading) {
      reset();
      router.push(`/account/${transactionResult.data.accountId}`);
    }
  }, [transactionResult, transactionLoading, mounted]);

  const type = watch("type");
  const isRecurring = watch("isRecurring");
  const date = watch("date");

  const filteredCategories = categories.filter((c) => c.type === type);

  // Render only after mount to prevent SSR hydration issues
  if (!mounted) return null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {!editMode && <ReceiptScanner onScanComplete={handleScanComplete} />}

      {/* Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Type</label>
        <Select onValueChange={(value) => setValue("type", value)} defaultValue={type}>
          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="EXPENSE">Expense</SelectItem>
            <SelectItem value="INCOME">Income</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && <p className="text-sm text-red-500">{errors.type.message}</p>}
      </div>

      {/* Amount & Account */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Amount</label>
          <Input type="number" step="0.01" placeholder="0.00" {...register("amount")} />
          {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Account</label>
          <Select onValueChange={(value) => setValue("accountId", value)} defaultValue={getValues("accountId")}>
            <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
            <SelectContent>
              {accounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.name} (${parseFloat(acc.balance).toFixed(2)})
                </SelectItem>
              ))}
              <CreateAccountDrawer>
                <Button variant="ghost" className="w-full">Create Account</Button>
              </CreateAccountDrawer>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Category</label>
        <Select onValueChange={(value) => setValue("category", value)} defaultValue={getValues("category")}>
          <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
          <SelectContent>
            {filteredCategories.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Date */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !date && "text-muted-foreground")}>
              {date ? format(date, "PPP") : "Pick a date"}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={date} onSelect={(d) => setValue("date", d)} />
          </PopoverContent>
        </Popover>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Input placeholder="Enter description" {...register("description")} />
      </div>

      {/* Recurring */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <label className="text-base font-medium">Recurring Transaction</label>
          <div className="text-sm text-muted-foreground">Set up a recurring schedule</div>
        </div>
        <Switch checked={isRecurring} onCheckedChange={(checked) => setValue("isRecurring", checked)} />
      </div>

      {isRecurring && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Recurring Interval</label>
          <Select onValueChange={(value) => setValue("recurringInterval", value)} defaultValue={getValues("recurringInterval")}>
            <SelectTrigger><SelectValue placeholder="Select interval" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="DAILY">Daily</SelectItem>
              <SelectItem value="WEEKLY">Weekly</SelectItem>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="YEARLY">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button type="button" variant="outline" className="w-full" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" className="w-full" disabled={transactionLoading}>
          {transactionLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : (editMode ? "Update Transaction" : "Create Transaction")}
        </Button>
      </div>
    </form>
  );
}
