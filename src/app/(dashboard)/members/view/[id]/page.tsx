import { Metadata } from "next"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { format } from "date-fns"
import { ArrowLeft, Mail, Phone, MapPin, Plane, Award, Shield, CalendarClock, CreditCard, Clock, Plus } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableHead, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { AccountSummary } from "@/components/members/account-summary"
import { MemberInvoicesTable } from "@/components/members/member-invoices-table"

export const metadata: Metadata = {
  title: "View Member",
  description: "View member details and information.",
}

interface MemberPageProps {
  params: Promise<{
    id: string
  }>
}

function getInitials(name: string | null): string {
  if (!name) return "??"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

function formatDate(date: string | undefined | null): string {
  if (!date) return "Not set"
  return format(new Date(date), "PPP")
}

// Add type for prime ratings and type ratings
type Rating = string;

interface PilotDetails {
  id: string
  caaClientNumber?: string | null
  licenceType?: string | null
  typeRatings: string[]
  class1Expiry?: string | null
  class2Expiry?: string | null
  dl9Expiry?: string | null
  bfrExpiry?: string | null
  endorsements: string[]
  primeRatings: string[]
}

interface Membership {
  id: string
  membershipType: string
  status: string
  startDate: string
  expiryDate: string
  paid: boolean
}

interface Member {
  id: string
  name: string | null
  email: string
  memberStatus: string
  memberNumber?: string
  pilotDetails: PilotDetails[]
  memberships?: Membership[]
}

// Add this helper function to get pilot details
function getPilotDetails(member: Member): PilotDetails | null {
  return member.pilotDetails && member.pilotDetails.length > 0 
    ? member.pilotDetails[0] 
    : null;
}

// Helper function to get active membership
function getActiveMembership(memberships: Membership[] | undefined): Membership | undefined {
  return memberships?.find(m => m.status === 'ACTIVE');
}

// Helper function to get expired memberships
function getExpiredMemberships(memberships: Membership[] | undefined): Membership[] {
  return memberships?.filter(m => m.status === 'EXPIRED') || [];
}

export default async function MemberPage({ params }: MemberPageProps) {
  const { id } = await params

  const supabase = createServerComponentClient({
    cookies,
  })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/signin")
  }

  try {
    // First, verify the user exists
    const { data: userExists, error: userError } = await supabase
      .from("User")
      .select("id")
      .eq("id", id)
      .single()

    if (userError) {
      throw new Error(`User check failed: ${userError.message}`)
    }

    if (!userExists) {
      return <div>Member not found</div>
    }

    // Then fetch all the details
    const { data: member, error } = await supabase
      .from("User")
      .select(`
        *,
        pilotDetails:UserPilotDetails(
          id,
          caaClientNumber,
          licenceType,
          typeRatings,
          class1Expiry,
          class2Expiry,
          dl9Expiry,
          bfrExpiry,
          endorsements,
          primeRatings
        ),
        memberships:UserMemberships(
          id,
          membershipType,
          status,
          startDate,
          expiryDate,
          paid
        )
      `)
      .eq("id", id)
      .single()

    if (error) {
      throw new Error(`Failed to fetch member details: ${error.message}`)
    }

    if (!member) {
      return <div>Member not found</div>
    }

    const activeMembership = getActiveMembership(member.memberships);
    const expiredMemberships = getExpiredMemberships(member.memberships);

    return (
      <div className="min-h-screen bg-background">
        {/* Header Section with Background */}
        <div className="bg-card border-b">
          <div className="container mx-auto max-w-7xl px-6">
            {/* Back Button */}
            <div className="py-4">
              <Link href="/members" className="inline-block">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Members
                </Button>
              </Link>
            </div>

            {/* Member Header */}
            <div className="py-8">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div className="flex items-start space-x-6">
                  <Avatar className="h-28 w-28 border-2 border-border">
                    {member.photo_url ? (
                      <AvatarImage src={member.photo_url} alt={member.name || "Member"} />
                    ) : (
                      <AvatarFallback className="text-xl">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="space-y-4">
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight">{member.name}</h1>
                      <div className="flex items-center space-x-4 mt-2">
                        <Badge 
                          className="px-3 py-1 text-sm"
                          variant={member.memberStatus === "ACTIVE" ? "default" : 
                                  member.memberStatus === "SUSPENDED" ? "destructive" : "secondary"}
                        >
                          {member.memberStatus}
                        </Badge>
                        {member.memberNumber && (
                          <span className="text-sm text-muted-foreground font-medium">
                            Member #{member.memberNumber}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Button variant="outline" size="sm" className="shadow-sm">
                        <Mail className="h-4 w-4 mr-2" />
                        Send Email
                      </Button>
                      <Button variant="outline" size="sm" className="shadow-sm">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Create Invoice
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto max-w-7xl px-6 py-8">
          {/* Tabs Navigation */}
          <Tabs defaultValue="contact" className="space-y-8">
            <div className="bg-card border rounded-lg">
              <TabsList className="w-full justify-start p-2">
                <TabsTrigger value="contact">Contact Information</TabsTrigger>
                <TabsTrigger value="membership">Membership</TabsTrigger>
                <TabsTrigger value="pilot-details">Pilot Details</TabsTrigger>
                <TabsTrigger value="flight-history">Flight History</TabsTrigger>
                <TabsTrigger value="bookings">Bookings</TabsTrigger>
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
              </TabsList>
            </div>

            {/* Contact Information Tab */}
            <TabsContent value="contact" className="space-y-6">
              <Card className="shadow-sm">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-6">Contact Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <Mail className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span className="font-medium">{member.email}</span>
                    </div>
                    <div className="flex items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <Phone className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span>{member.phone || "No phone number"}</span>
                    </div>
                    <div className="flex items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <MapPin className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span>{member.address || "No address"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Membership Tab */}
            <TabsContent value="membership" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Membership Details</h3>
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Membership
                </Button>
              </div>

              <div className="grid gap-4">
                {/* Active Membership Card */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Award className="h-5 w-5 text-primary" />
                      <h3 className="text-base font-semibold">Current Membership</h3>
                    </div>
                    
                    {activeMembership ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Membership Type</p>
                            <p className="text-lg font-semibold mt-1">{activeMembership.membershipType}</p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={activeMembership.paid ? "default" : "destructive"}>
                              {activeMembership.paid ? "PAID" : "UNPAID"}
                            </Badge>
                            <Badge variant="secondary">{activeMembership.status}</Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                          <div className="bg-muted/30 p-3 rounded-lg">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <CalendarClock className="h-4 w-4 text-primary" />
                              <span className="font-medium">Started</span>
                            </div>
                            <p className="mt-1 font-medium text-sm">
                              {format(new Date(activeMembership.startDate), 'PPP')}
                            </p>
                          </div>
                          <div className="bg-muted/30 p-3 rounded-lg">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4 text-primary" />
                              <span className="font-medium">Expires</span>
                            </div>
                            <p className="mt-1 font-medium text-sm">
                              {format(new Date(activeMembership.expiryDate), 'PPP')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <p>No active membership found</p>
                        <Button variant="outline" size="sm" className="mt-3">
                          <Plus className="h-4 w-4 mr-2" />
                          Add New Membership
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Membership History Card */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <h3 className="text-base font-semibold">Membership History</h3>
                    </div>
                    
                    {expiredMemberships.length > 0 ? (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Type</TableHead>
                              <TableHead>Started</TableHead>
                              <TableHead>Expired</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Payment</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {expiredMemberships.map((membership) => (
                              <TableRow key={membership.id}>
                                <TableCell className="font-medium">{membership.membershipType}</TableCell>
                                <TableCell className="text-sm">{format(new Date(membership.startDate), 'PP')}</TableCell>
                                <TableCell className="text-sm">{format(new Date(membership.expiryDate), 'PP')}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className="text-xs">{membership.status}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={membership.paid ? "default" : "destructive"}
                                    className="text-xs"
                                  >
                                    {membership.paid ? "PAID" : "UNPAID"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-sm text-muted-foreground border rounded-md bg-muted/5">
                        No expired memberships found
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Pilot Details Tab */}
            <TabsContent value="pilot-details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-4">
                  <Card className="shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Plane className="h-5 w-5 text-primary" />
                        <h3 className="text-base font-semibold">Licence Information</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center p-2 rounded-lg bg-muted/30">
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">CAA Client Number</span>
                            <span className="font-medium">{getPilotDetails(member)?.caaClientNumber || "Not set"}</span>
                          </div>
                        </div>
                        <div className="flex items-center p-2 rounded-lg bg-muted/30">
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">Licence Type</span>
                            <Badge variant="default" className="w-fit mt-1">
                              {getPilotDetails(member)?.licenceType?.replace("_", " ") || "Not set"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="h-5 w-5 text-primary" />
                        <h3 className="text-base font-semibold">Medical & Currency</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center p-2 rounded-lg bg-muted/30">
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">Class 1 Medical</span>
                            <span className="font-medium">{formatDate(getPilotDetails(member)?.class1Expiry)}</span>
                          </div>
                        </div>
                        <div className="flex items-center p-2 rounded-lg bg-muted/30">
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">BFR Expiry</span>
                            <span className="font-medium">{formatDate(getPilotDetails(member)?.bfrExpiry)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column */}
                <div>
                  <Card className="shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Award className="h-5 w-5 text-primary" />
                        <h3 className="text-base font-semibold">Ratings & Endorsements</h3>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <span className="text-xs text-muted-foreground block mb-1">Prime Ratings</span>
                          <div className="bg-muted/30 p-2 rounded-lg">
                            {(getPilotDetails(member)?.primeRatings ?? []).length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {(getPilotDetails(member)?.primeRatings ?? []).map((rating: Rating, index: number) => (
                                  <Badge 
                                    key={index} 
                                    variant="secondary" 
                                    className="bg-black text-white hover:bg-black/90"
                                  >
                                    <Award className="h-3 w-3 mr-1" />
                                    {rating}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">No ratings</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground block mb-1">Type Ratings</span>
                          <div className="bg-muted/30 p-2 rounded-lg">
                            {(getPilotDetails(member)?.typeRatings ?? []).length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {(getPilotDetails(member)?.typeRatings ?? []).map((rating: Rating, index: number) => (
                                  <Badge key={index} variant="secondary" className="bg-secondary hover:bg-secondary/90">
                                    <Plane className="h-3 w-3 mr-1" />
                                    {rating}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">No type ratings</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="flight-history">
              <Card className="shadow-sm">
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">Flight history coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bookings">
              <Card className="shadow-sm">
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">Bookings coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="account">
              <Card className="shadow-sm">
                <CardContent className="pt-6">
                  <div className="space-y-12">
                    <div>
                      <h3 className="text-lg font-semibold mb-6">Account Summary</h3>
                      <AccountSummary userId={id} />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold mb-4">Invoices</h2>
                      <MemberInvoicesTable userId={id} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="progress">
              <Card className="shadow-sm">
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">Progress tracking coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    )
  } catch (error) {
    return <div>Error loading member details: {error instanceof Error ? error.message : 'Unknown error'}</div>
  }
} 