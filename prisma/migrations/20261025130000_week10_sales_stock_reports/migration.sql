-- Drop the unused quantity column (Database Design: one row = one garment).
ALTER TABLE "Item" DROP COLUMN "quantity";

-- Indexes for the Week 10 search, stock, and report queries.
CREATE INDEX "Item_status_idx" ON "Item"("status");
CREATE INDEX "Item_brand_size_idx" ON "Item"("brand", "size");
CREATE INDEX "Item_price_idx" ON "Item"("price");
CREATE INDEX "StatusLog_itemId_changedAt_idx" ON "StatusLog"("itemId", "changedAt");
CREATE INDEX "StatusLog_changedAt_idx" ON "StatusLog"("changedAt");
