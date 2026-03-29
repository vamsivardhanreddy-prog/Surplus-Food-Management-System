
import { Card, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Users, Utensils, Info } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";







export function DonationCard({ donation, actionButton }) {
  const isExpired = new Date(donation.expiryTime) < new Date();
  const statusColor = {
    available: "bg-emerald-100 text-emerald-800 border-emerald-200",
    claimed: "bg-amber-100 text-amber-800 border-amber-200",
    completed: "bg-blue-100 text-blue-800 border-blue-200"
  };

  const dietColor = {
    veg: "bg-green-100 text-green-700",
    "non-veg": "bg-orange-100 text-orange-700",
    both: "bg-gray-100 text-gray-700"
  };

  return (
    <Card className="overflow-hidden card-hover border-border/50 flex flex-col h-full rounded-2xl">
      <div className="p-5 flex-1 space-y-4">
        <div className="flex justify-between items-start gap-2">
          <div>
            <h3 className="font-bold text-lg text-foreground line-clamp-1" title={donation.title}>
              {donation.title}
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" />
              <span className="line-clamp-1">{donation.pickupAddress}</span>
              {donation.distanceKm !== undefined && donation.distanceKm !== null &&
              <span className="font-medium text-secondary">({donation.distanceKm.toFixed(1)} km)</span>
              }
            </p>
          </div>
          <Badge variant="outline" className={`${statusColor[donation.status]} uppercase tracking-wider text-[10px] font-bold shrink-0`}>
            {donation.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-foreground/80 bg-muted/30 p-2 rounded-lg">
            <Users className="h-4 w-4 text-primary" />
            <span>Serves {donation.servesCount}</span>
          </div>
          <div className="flex items-center gap-2 text-foreground/80 bg-muted/30 p-2 rounded-lg">
            <Clock className="h-4 w-4 text-primary" />
            <span className={isExpired && donation.status === "available" ? "text-destructive font-medium" : ""}>
              {formatDistanceToNow(new Date(donation.expiryTime), { addSuffix: true })}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Utensils className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">Food Items:</span>
            <Badge variant="secondary" className={`${dietColor[donation.dietaryType]} ml-auto text-[10px]`}>
              {donation.dietaryType.toUpperCase()}
            </Badge>
          </div>
          <ul className="text-sm text-muted-foreground space-y-1 bg-muted/10 p-3 rounded-lg border border-border/30">
            {donation.foodItems.slice(0, 3).map((item, idx) =>
            <li key={idx} className="flex justify-between">
                <span className="truncate pr-2">{item.name}</span>
                <span className="font-medium shrink-0">{item.quantity}</span>
              </li>
            )}
            {donation.foodItems.length > 3 &&
            <li className="text-xs italic pt-1">+ {donation.foodItems.length - 3} more items</li>
            }
          </ul>
        </div>
        
        {donation.specialInstructions &&
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-secondary/5 p-2 rounded-lg">
            <Info className="h-3 w-3 mt-0.5 shrink-0 text-secondary" />
            <span className="line-clamp-2">{donation.specialInstructions}</span>
          </div>
        }
      </div>

      <CardFooter className="p-5 pt-0 bg-muted/10 border-t border-border/50 flex items-center justify-between gap-3 mt-auto">
        <div className="text-xs text-muted-foreground flex flex-col">
          <span>Posted {format(new Date(donation.createdAt), "MMM d, h:mm a")}</span>
          {donation.donator &&
          <span className="font-medium truncate max-w-[120px]">by {donation.donator.name}</span>
          }
        </div>
        {actionButton}
      </CardFooter>
    </Card>);

}