import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useAuthContext } from "@/providers/auth-provider"
import { Search } from "lucide-react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { InvoiceItem, Chargeable, BookingInvoiceFormProps } from '@/types/booking'
import { TYPE_ORDER, TYPE_LABELS } from '@/constants/chargeable'

export function BookingInvoiceForm({ 
  calculatedCharge, 
  booking,
  onInvoiceItemsChange 
}: BookingInvoiceFormProps) {
  const { user } = useAuthContext()
  const supabase = createClientComponentClient()
  const [chargeables, setChargeables] = useState<Chargeable[]>([])
  const [filteredChargeables, setFilteredChargeables] = useState<Chargeable[]>([])
  const [activeTab, setActiveTab] = useState<string>("all")
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([])
  const initialFlightChargeSet = useRef(false)

  const groupedChargeables = useMemo(() => {
    return filteredChargeables.reduce((groups, item) => {
      const group = groups[item.type] || [];
      group.push(item);
      groups[item.type] = group;
      return groups;
    }, {} as Record<Chargeable['type'], Chargeable[]>);
  }, [filteredChargeables]);

  const filteredChargeablesByTab = useMemo(() => {
    if (activeTab === "landing-fees") {
      return filteredChargeables.filter(item => item.type === "LANDING_FEE")
    }
    if (activeTab === "airways") {
      return filteredChargeables.filter(item => item.type === "AIRWAYS_FEE")
    }
    return filteredChargeables
  }, [activeTab, filteredChargeables]);

  // Fetch chargeables on mount
  useEffect(() => {
    const fetchChargeables = async () => {
      if (!user?.user_metadata?.organizationId) return

      const { data: chargeablesData, error } = await supabase
        .from("Chargeable")
        .select("*")
        .eq("organizationId", user.user_metadata.organizationId)
        .eq("isActive", true)
        .order("name")

      if (error) {
        console.error('Error fetching chargeables:', error)
        return
      }

      if (chargeablesData) {
        setChargeables(chargeablesData)
        setFilteredChargeables(chargeablesData)
      }
    }

    fetchChargeables()
  }, [user?.user_metadata?.organizationId, supabase])

  // Set initial flight charge item
  useEffect(() => {
    if (calculatedCharge !== null && !initialFlightChargeSet.current) {
      initialFlightChargeSet.current = true
      const flightChargeItem: InvoiceItem = {
        description: `Flight Charge - ${booking.Aircraft?.registration} (${booking.FlightTypes?.name})`,
        quantity: 1,
        unitPrice: calculatedCharge,
        total: calculatedCharge,
        chargeableId: '' // This will be set by the check-in process
      }
      
      setInvoiceItems([flightChargeItem])
      onInvoiceItemsChange?.([flightChargeItem])
    }
  }, [calculatedCharge, booking.Aircraft?.registration, booking.FlightTypes?.name, onInvoiceItemsChange])

  // Reset when calculatedCharge becomes null
  useEffect(() => {
    if (calculatedCharge === null) {
      initialFlightChargeSet.current = false
      setInvoiceItems([])
    }
  }, [calculatedCharge])

  const handleChargeableSearch = useCallback((query: string) => {
    setFilteredChargeables(chargeables.filter(
      (item) =>
        item.name?.toLowerCase().includes(query.toLowerCase()) ||
        item.description?.toLowerCase().includes(query.toLowerCase())
    ))
  }, [chargeables])

  const updateInvoiceItem = useCallback((index: number, field: keyof InvoiceItem, value: string | number) => {
    setInvoiceItems(prevItems => {
      const updatedItems = [...prevItems]
      const item = { ...updatedItems[index] }
      
      if (field === 'quantity' || field === 'unitPrice') {
        item[field] = Number(value)
        item.total = item.quantity * item.unitPrice
      } else if (field === 'description') {
        item[field] = value as string
      }
      
      updatedItems[index] = item
      onInvoiceItemsChange?.(updatedItems)
      return updatedItems
    })
  }, [onInvoiceItemsChange])

  const removeInvoiceItem = useCallback((index: number) => {
    if (index === 0) return // Prevent removing the flight charge item
    setInvoiceItems(prevItems => {
      const newItems = prevItems.filter((_, i) => i !== index)
      onInvoiceItemsChange?.(newItems)
      return newItems
    })
  }, [onInvoiceItemsChange])

  const calculateTotal = useCallback(() => {
    return invoiceItems.reduce((sum, item) => sum + item.total, 0)
  }, [invoiceItems])

  const handleAddInvoiceItem = useCallback((item: Chargeable) => {
    // Create new item outside of setState to avoid nested updates
    const newItem: InvoiceItem = {
      description: item.name,
      quantity: 1,
      unitPrice: item.unitPrice,
      total: item.unitPrice,
      chargeableId: item.id
    }

    // Update local state first
    const newItems = [...invoiceItems, newItem]
    setInvoiceItems(newItems)
    
    // Then notify parent after state is updated
    if (onInvoiceItemsChange) {
      setTimeout(() => {
        onInvoiceItemsChange(newItems)
      }, 0)
    }
  }, [invoiceItems, onInvoiceItemsChange])

  // Modify the CommandItem onSelect to use a proper event handler
  const handleItemSelect = useCallback((item: Chargeable) => {
    return () => {
      handleAddInvoiceItem(item)
    }
  }, [handleAddInvoiceItem])

  return (
    <Card>
      <CardHeader className="bg-emerald-50/60 pb-4">
        <h2 className="text-lg font-semibold">Invoice Details</h2>
      </CardHeader>
      <CardContent className="pt-4">
        {calculatedCharge === null ? (
          <p className="text-muted-foreground">
            Invoice details will be calculated based on flight times.
          </p>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              {invoiceItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-start">
                  <div className="col-span-6">
                    <Label className="text-sm">Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm">Quantity</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateInvoiceItem(index, 'quantity', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm">Unit Price</Label>
                    <Input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateInvoiceItem(index, 'unitPrice', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="col-span-1">
                    <Label className="text-sm">Total</Label>
                    <p className="mt-2 font-medium">${item.total.toFixed(2)}</p>
                  </div>
                  <div className="col-span-1 pt-7">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => removeInvoiceItem(index)}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}

              <div className="flex flex-col space-y-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      <span className="text-muted-foreground">Add invoice item...</span>
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[600px] p-0" align="start">
                    <Tabs defaultValue="all" onValueChange={setActiveTab}>
                      <TabsList className="w-full">
                        <TabsTrigger value="all" className="flex-1">All Items</TabsTrigger>
                        <TabsTrigger value="landing-fees" className="flex-1">Landing Fees</TabsTrigger>
                        <TabsTrigger value="airways" className="flex-1">Airways Charges</TabsTrigger>
                        <TabsTrigger value="other" className="flex-1" disabled>Other Charges</TabsTrigger>
                      </TabsList>

                      <TabsContent value="all" className="border-none p-0">
                        <Command>
                          <CommandInput 
                            placeholder="Type to search items..." 
                            onValueChange={handleChargeableSearch}
                          />
                          <CommandList>
                            <CommandEmpty>No items found.</CommandEmpty>
                            {TYPE_ORDER.map(type => {
                              const items = groupedChargeables[type];
                              if (!items?.length) return null;
                              
                              return (
                                <CommandGroup key={type} heading={TYPE_LABELS[type]}>
                                  {items.map((item) => (
                                    <CommandItem
                                      key={item.id}
                                      onSelect={handleItemSelect(item)}
                                      className="flex items-center py-3"
                                    >
                                      <div className="flex flex-col gap-1">
                                        <p className="font-medium">{item.name}</p>
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm text-muted-foreground">
                                            ${item.unitPrice.toFixed(2)}
                                          </span>
                                          {item.description && (
                                            <span className="text-xs text-muted-foreground">
                                              • {item.description}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              );
                            })}
                          </CommandList>
                        </Command>
                      </TabsContent>

                      <TabsContent value="landing-fees" className="border-none p-0">
                        <Command>
                          <CommandInput 
                            placeholder="Search landing fees..." 
                            onValueChange={handleChargeableSearch}
                          />
                          <CommandList>
                            <CommandEmpty>No landing fees found.</CommandEmpty>
                            <CommandGroup heading="Landing Fees">
                              {filteredChargeablesByTab.map((item) => (
                                <CommandItem
                                  key={item.id}
                                  onSelect={handleItemSelect(item)}
                                  className="flex items-center py-3"
                                >
                                  <div className="flex flex-col gap-1">
                                    <p className="font-medium">{item.name}</p>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-muted-foreground">
                                        ${item.unitPrice.toFixed(2)}
                                      </span>
                                      {item.description && (
                                        <span className="text-xs text-muted-foreground">
                                          • {item.description}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </TabsContent>

                      <TabsContent value="airways" className="border-none p-0">
                        <Command>
                          <CommandInput 
                            placeholder="Search airways charges..." 
                            onValueChange={handleChargeableSearch}
                          />
                          <CommandList>
                            <CommandEmpty>No airways charges found.</CommandEmpty>
                            <CommandGroup heading="Airways Charges">
                              {filteredChargeablesByTab.map((item) => (
                                <CommandItem
                                  key={item.id}
                                  onSelect={handleItemSelect(item)}
                                  className="flex items-center py-3"
                                >
                                  <div className="flex flex-col gap-1">
                                    <p className="font-medium">{item.name}</p>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-muted-foreground">
                                        ${item.unitPrice.toFixed(2)}
                                      </span>
                                      {item.description && (
                                        <span className="text-xs text-muted-foreground">
                                          • {item.description}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </TabsContent>
                    </Tabs>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <Label className="text-lg font-semibold">Total Amount</Label>
                <p className="text-lg font-semibold">
                  ${calculateTotal().toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 