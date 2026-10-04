# AlphaLogix TMS — Prototype v1

This is a local, browser-based prototype customized for AlphaLogix Transport Solutions LLC.

## Current rules
- Dispatcher pay: 10% of gross load amount
- Driver pay: $0.60 per total dispatched mile
- Total dispatched miles = loaded miles + deadhead miles
- Fuel/MPG tracking: calculated from odometer + fuel entries
- Load profitability: gross minus dispatcher, driver, fuel, tolls/permits, and other expenses

## Fuel / MPG logic
For best accuracy:
1. Enter every fuel purchase.
2. Enter the truck odometer at each purchase.
3. Mark "Full tank" whenever you fill completely.
4. MPG is calculated between full-tank events, including partial-fill gallons in between.

## How to use
Open `AlphaLogix_TMS.html` in a modern browser.

Data is stored locally in that browser/device using localStorage. Use Settings > Export Backup regularly.

## Included
- Dashboard
- Load management
- Dispatch/load status
- Dispatcher pay calculation
- Driver pay calculation
- Fuel log
- MPG tracking
- Actual or estimated fuel cost by load
- Profit, margin, revenue/mile, net/mile
- CSV export
- JSON backup/import

## Next logical upgrades
- Driver profiles and settlements
- Broker/customer profiles
- Rate confirmation / BOL / POD document uploads
- Invoice generation and accounts receivable
- Truck/trailer maintenance
- IFTA mileage and fuel by state
- User logins / cloud database / mobile access
- QuickBooks integration
