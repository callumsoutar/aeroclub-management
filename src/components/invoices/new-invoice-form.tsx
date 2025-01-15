"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuthContext } from "@/providers/auth-provider";
import { format } from "date-fns";
import { Search, Trash2, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { calculateInvoiceTotals, calculateItemSubtotal, calculateItemTotal } from "@/lib/invoice-calculations";

interface User {
  id: string;
  name: string;
  email: string;
}

interface Chargeable {
  id: string;
  name: string;
  unitPrice: number;
  taxRate: number;
  description?: string;
}

interface InvoiceItemCalculation {
  chargeableId: string;
  quantity: number;
  unitPrice: number;
}

const invoiceItemSchema = z.object({
  chargeableId: z.string().min(1, "Please select a chargeable item"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price must be positive"),
  description: z.string().optional(),
});

const newInvoiceSchema = z.object({
  userId: z.string().min(1, "Please select a member"),
  invoiceDate: z.date({
    required_error: "Please select an invoice date",
  }),
  dueDate: z.date({
    required_error: "Please select a due date",
  }),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(invoiceItemSchema).min(1, "Please add at least one item"),
});

type NewInvoiceValues = z.infer<typeof newInvoiceSchema>;

export function NewInvoiceForm() {
  const router = useRouter();
  const { user } = useAuthContext();
  const [isLoading, setIsLoading] = React.useState(false);
  const [users, setUsers] = React.useState<User[]>([]);
  const [chargeables, setChargeables] = React.useState<Chargeable[]>([]);
  const supabase = createClientComponentClient();
  const [selectedMember, setSelectedMember] = React.useState<User | null>(null);
  const [filteredUsers, setFilteredUsers] = React.useState<User[]>([]);
  const [filteredChargeables, setFilteredChargeables] = React.useState<Chargeable[]>([]);

  const form = useForm<NewInvoiceValues>({
    resolver: zodResolver(newInvoiceSchema),
    defaultValues: {
      items: [],
      notes: "",
      reference: "",
      invoiceDate: new Date(),
      dueDate: new Date(),
      userId: ""
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Fetch members and chargeables on mount
  React.useEffect(() => {
    async function fetchData() {
      const { data: usersData } = await supabase
        .from("User")
        .select("id, name, email")
        .eq("organizationId", user?.user_metadata?.organizationId)
        .order("name");

      const { data: chargeablesData } = await supabase
        .from("Chargeable")
        .select("*")
        .eq("organizationId", user?.user_metadata?.organizationId)
        .eq("isActive", true)
        .order("name");

      if (usersData) {
        setUsers(usersData);
        setFilteredUsers(usersData);
      }
      if (chargeablesData) {
        setChargeables(chargeablesData);
        setFilteredChargeables(chargeablesData);
      }
    }

    if (user?.user_metadata?.organizationId) {
      fetchData();
    }
  }, [user?.user_metadata?.organizationId, supabase]);

  // Modify the search handler to be simpler and more direct
  const handleMemberSearch = React.useCallback(
    (query: string) => {
      console.log('Search query:', query);
      const filtered = users.filter(
        (user) =>
          user.name?.toLowerCase().includes(query.toLowerCase()) ||
          user.email?.toLowerCase().includes(query.toLowerCase())
      );
      console.log('Filtered users:', filtered);
      setFilteredUsers(filtered);
    },
    [users]
  );

  // Add function to handle member selection
  const handleMemberSelect = React.useCallback(
    async (userId: string) => {
      console.log('Selected user ID:', userId);
      const selectedUser = users.find((user) => user.id === userId);
      console.log('Found user:', selectedUser);
      if (selectedUser) {
        setSelectedMember(selectedUser);
        form.setValue("userId", userId);
      }
    },
    [users, form]
  );

  // Add search handler for chargeables
  const handleChargeableSearch = React.useCallback(
    (query: string) => {
      console.log('Search chargeable query:', query);
      const filtered = chargeables.filter(
        (item) =>
          item.name?.toLowerCase().includes(query.toLowerCase()) ||
          item.description?.toLowerCase().includes(query.toLowerCase())
      );
      console.log('Filtered chargeables:', filtered);
      setFilteredChargeables(filtered);
    },
    [chargeables]
  );

  // Add debug function
  const debugInvoiceCreation = async () => {
    try {
      // Check existing invoices for today
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const { data: existingInvoices, error: queryError } = await supabase
        .from("Invoice")
        .select("invoiceNumber, createdAt, status")
        .gte("createdAt", `${todayStr}T00:00:00`)
        .lte("createdAt", `${todayStr}T23:59:59`)
        .order("createdAt", { ascending: true });

      if (queryError) {
        console.error("Error checking existing invoices:", queryError);
        return;
      }

      console.log("Today's invoices:", existingInvoices);
      return existingInvoices;
    } catch (error: unknown) {
      console.error("Debug function error:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
      }
    }
  };

  async function onSubmit(data: NewInvoiceValues) {
    setIsLoading(true);
    try {
      console.log('Form submission started with data:', data);
      
      // Debug: Check existing invoices before creation
      const existingInvoices = await debugInvoiceCreation();
      console.log("Existing invoices before creation:", existingInvoices);

      // Calculate totals for each item and the invoice
      const invoiceItems = data.items.map(item => {
        const chargeable = chargeables.find(c => c.id === item.chargeableId);
        console.log('Found chargeable for item:', chargeable);
        const taxRate = chargeable?.taxRate ?? 0.15;
        
        if (typeof taxRate !== 'number' || taxRate < 0 || taxRate > 1) {
          throw new Error(`Invalid tax rate ${taxRate} for item ${chargeable?.name}`);
        }

        return {
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate
        };
      });

      console.log('Calculated invoice items:', invoiceItems);

      const { subtotal: calculatedSubtotal, tax: calculatedTax, total: calculatedTotal } = calculateInvoiceTotals(invoiceItems);
      console.log('Invoice totals:', { subtotal: calculatedSubtotal, tax: calculatedTax, total: calculatedTotal });

      // Create invoice with direct table insertion
      const { data: createdInvoice, error: invoiceError } = await supabase
        .from("Invoice")
        .insert({
          id: `inv_${crypto.randomUUID()}`,
          userId: data.userId,
          organizationId: user?.user_metadata?.organizationId,
          issuedDate: data.invoiceDate.toISOString(),
          dueDate: data.dueDate.toISOString(),
          notes: data.notes || null,
          reference: data.reference || null,
          subtotal: calculatedSubtotal,
          tax: calculatedTax,
          total: calculatedTotal,
          status: "PENDING",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select('id')
        .single();

      if (invoiceError) {
        console.error("Error creating invoice:", invoiceError);
        console.error("Error details:", {
          code: invoiceError.code,
          message: invoiceError.message,
          details: invoiceError.details,
          hint: invoiceError.hint
        });
        
        if (invoiceError.code === '23503') { // Foreign key violation
          toast.error("Invalid user or organization reference.");
        } else if (invoiceError.code === '23502') { // Not null violation
          toast.error("Missing required fields.");
        } else {
          toast.error(`Failed to create invoice: ${invoiceError.message}`);
        }
        throw invoiceError;
      }

      if (!createdInvoice) {
        console.error("No invoice data returned");
        toast.error("Failed to create invoice. Please try again.");
        throw new Error("No invoice data returned");
      }

      console.log('Created invoice:', createdInvoice);

      // Create invoice items
      const calculatedInvoiceItems = data.items.map((item) => {
        const chargeable = chargeables.find(c => c.id === item.chargeableId);
        console.log('Processing item with chargeable:', { item, chargeable });
        
        const taxRate = chargeable?.taxRate ?? 0.15;
        
        if (typeof taxRate !== 'number' || taxRate < 0 || taxRate > 1) {
          throw new Error(`Invalid tax rate ${taxRate} for item ${chargeable?.name}`);
        }

        const itemCalc = {
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate
        };

        const subTotal = calculateItemSubtotal(itemCalc);
        const total = calculateItemTotal(itemCalc);

        return {
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          tax: taxRate,
          total: total,
          description: item.description || null,
          invoiceId: createdInvoice.id,
          chargeableId: item.chargeableId,
          organizationId: user?.user_metadata?.organizationId,
          subTotal: subTotal
        };
      });

      const { error: itemsError } = await supabase
        .from("InvoiceItem")
        .insert(calculatedInvoiceItems);

      if (itemsError) {
        console.error("Error creating invoice items:", itemsError);
        console.error("Error details:", {
          code: itemsError.code,
          message: itemsError.message,
          details: itemsError.details,
          hint: itemsError.hint
        });
        toast.error("Failed to create invoice items. Please try again.");
        throw itemsError;
      }

      toast.success("Invoice created successfully");
      router.push(`/invoices/view/${createdInvoice.id}`);
    } catch (error: unknown) {
      console.error("Error in form submission:", error);
      if (error instanceof Error) {
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        toast.error(error.message);
      } else if (typeof error === 'object' && error !== null) {
        console.error("Error object:", error);
        toast.error("An unexpected error occurred. Please check the console for details.");
      } else {
        console.error("Unknown error type:", error);
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  const calculateSubtotal = (items: InvoiceItemCalculation[]) => {
    return items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity.toString()) || 0;
      const unitPrice = parseFloat(item.unitPrice.toString()) || 0;
      return sum + quantity * unitPrice;
    }, 0);
  };

  const calculateTax = (items: InvoiceItemCalculation[]) => {
    return items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity?.toString()) || 0;
      const unitPrice = parseFloat(item.unitPrice?.toString()) || 0;
      const chargeable = chargeables.find(c => c.id === item.chargeableId);
      const taxRate = chargeable?.taxRate || 0;
      return sum + (quantity * unitPrice * taxRate);
    }, 0);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
            <CardDescription>
              Create a new invoice for a member or flight
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-[1fr,1fr,auto] gap-x-12 gap-y-6 max-w-[1200px]">
              <div className="space-y-4">
                {/* Member Selection */}
                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="mb-2">Select Member</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-[288px] justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? users.find((user) => user.id === field.value)
                                    ?.name
                                : "Search members..."}
                              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[288px] p-0" align="start">
                          <Command>
                            <CommandInput 
                              placeholder="Search members..." 
                              onValueChange={handleMemberSearch}
                            />
                            <CommandList>
                              <CommandEmpty>No member found.</CommandEmpty>
                              <CommandGroup heading="Members">
                                {filteredUsers.map((user) => (
                                  <CommandItem
                                    key={user.id}
                                    onSelect={() => {
                                      console.log("Selecting member:", user.name);
                                      handleMemberSelect(user.id);
                                      form.setValue("userId", user.id);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedMember?.id === user.id 
                                          ? "opacity-100" 
                                          : "opacity-0"
                                      )}
                                    />
                                    <div className="flex flex-col gap-1">
                                      <p className="font-medium">{user.name}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {user.email}
                                      </p>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Reference Field */}
                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="mb-2">Reference (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Flight Training, Membership" 
                          className="w-[288px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                {/* Invoice Date */}
                <FormField
                  control={form.control}
                  name="invoiceDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="mb-2">Invoice Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-[288px] justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Due Date */}
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="mb-2">Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-[288px] justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Bill To Section - Moved to the right */}
              {selectedMember && (
                <div className="w-[400px] p-4 bg-muted rounded-lg h-fit">
                  <h3 className="font-medium mb-2">Bill To:</h3>
                  <div className="space-y-1">
                    <p className="text-sm">{selectedMember.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedMember.email}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
            <CardDescription>
              Add items to your invoice
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search Bar for Items */}
            <div className="mb-8">
              <div className="flex flex-col space-y-2 max-w-[400px]">
                <FormLabel>Add Items</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between border-gray-300"
                    >
                      <span className="text-muted-foreground">Search for items to add...</span>
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput 
                        placeholder="Type to search items..." 
                        onValueChange={handleChargeableSearch}
                      />
                      <CommandList>
                        <CommandEmpty>No items found.</CommandEmpty>
                        <CommandGroup heading="Available Items">
                          {filteredChargeables.map((item) => (
                            <CommandItem
                              key={item.id}
                              onSelect={() => {
                                console.log("Adding item:", item.name);
                                append({
                                  chargeableId: item.id,
                                  quantity: 1,
                                  unitPrice: item.unitPrice,
                                });
                              }}
                              className="flex items-center py-3"
                            >
                              <div className="flex flex-col gap-1">
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  ${item.unitPrice.toFixed(2)}
                                </p>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Item</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => {
                  const quantity = form.getValues(`items.${index}.quantity`) || 0;
                  const unitPrice = form.getValues(`items.${index}.unitPrice`) || 0;
                  const subtotal = quantity * unitPrice;

                  return (
                    <TableRow key={field.id}>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`items.${index}.chargeableId`}
                          render={({ field: chargeableField }) => (
                            <FormItem>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      className={cn(
                                        "w-[300px] justify-between",
                                        !chargeableField.value && "text-muted-foreground"
                                      )}
                                    >
                                      {chargeableField.value
                                        ? chargeables.find((c) => c.id === chargeableField.value)?.name
                                        : "Select item"}
                                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0">
                                  <Command>
                                    <CommandInput 
                                      placeholder="Search items..." 
                                      onValueChange={handleChargeableSearch}
                                    />
                                    <CommandList>
                                      <CommandEmpty>No item found.</CommandEmpty>
                                      <CommandGroup heading="Items">
                                        {filteredChargeables.map((item) => (
                                          <CommandItem
                                            key={item.id}
                                            onSelect={() => {
                                              console.log("Selecting item:", item.name);
                                              form.setValue(
                                                `items.${index}.chargeableId`,
                                                item.id
                                              );
                                              form.setValue(
                                                `items.${index}.unitPrice`,
                                                item.unitPrice
                                              );
                                            }}
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                chargeableField.value === item.id 
                                                  ? "opacity-100" 
                                                  : "opacity-0"
                                              )}
                                            />
                                            <div className="flex flex-col gap-1">
                                              <p className="font-medium">{item.name}</p>
                                              <p className="text-sm text-muted-foreground">
                                                ${item.unitPrice.toFixed(2)}
                                              </p>
                                            </div>
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={1}
                                  className="w-20"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(parseInt(e.target.value))
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`items.${index}.unitPrice`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  className="w-24"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(parseFloat(e.target.value))
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(subtotal)}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            <div className="mt-4 flex justify-end">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Subtotal:</span>
                  <span className="ml-8">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(calculateSubtotal(form.getValues("items") || []))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Tax:</span>
                  <span className="ml-8">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(calculateTax(form.getValues("items") || []))}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-lg font-bold">Total:</span>
                  <span className="ml-8 text-lg font-bold">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(
                      calculateSubtotal(form.getValues("items") || []) + 
                      calculateTax(form.getValues("items") || [])
                    )}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Collapsible>
          <Card>
            <CardHeader className="cursor-pointer">
              <CollapsibleTrigger className="flex w-full items-center justify-between">
                <CardTitle>Additional Information</CardTitle>
                <ChevronDown className="h-4 w-4" />
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional notes or comments..."
                          className="min-h-[100px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Invoice"}
          </Button>
        </div>
      </form>
    </Form>
  )
} 