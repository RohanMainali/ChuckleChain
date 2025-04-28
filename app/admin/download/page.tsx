"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Download, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import axios from "axios"
import { useToast } from "@/components/ui/use-toast"

export default function DownloadPage() {
  const { toast } = useToast()
  const [fromDate, setFromDate] = useState<Date | undefined>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
  )
  const [toDate, setToDate] = useState<Date | undefined>(new Date())
  const [isLoading, setIsLoading] = useState(false)

  const handleDownload = async () => {
    if (!fromDate || !toDate) {
      toast({
        title: "Missing dates",
        description: "Please select both from and to dates",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Format dates for URL
      const fromDateStr = fromDate.toISOString().split("T")[0]
      const toDateStr = toDate.toISOString().split("T")[0]

      // Use axios to download the file
      const response = await axios.get(`/api/admin/download-memes?fromDate=${fromDateStr}&toDate=${toDateStr}`, {
        responseType: "blob", // Important for file downloads
      })

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `memes-${fromDateStr}-to-${toDateStr}.zip`)
      document.body.appendChild(link)
      link.click()
      link.remove()

      toast({
        title: "Download successful",
        description: "Your memes have been downloaded successfully",
      })
    } catch (error) {
      console.error("Download error:", error)
      toast({
        title: "Download failed",
        description: "There was an error downloading the memes. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Download Memes</h1>
        <p className="text-muted-foreground">Download memes created within a specific date range</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Date Range</CardTitle>
          <CardDescription>Choose the start and end dates for the memes you want to download</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="from-date">From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="from-date"
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !fromDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fromDate ? format(fromDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={fromDate} onSelect={setFromDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="to-date">To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="to-date"
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !toDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {toDate ? format(toDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={toDate} onSelect={setToDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleDownload} disabled={isLoading} className="ml-auto">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download Memes
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
