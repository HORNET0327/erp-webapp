BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Customer] (
    [id] NVARCHAR(1000) NOT NULL,
    [code] VARCHAR(32) NOT NULL,
    [name] VARCHAR(200) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Customer_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Customer_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Customer_code_key] UNIQUE NONCLUSTERED ([code])
);

-- CreateTable
CREATE TABLE [dbo].[Vendor] (
    [id] NVARCHAR(1000) NOT NULL,
    [code] VARCHAR(32) NOT NULL,
    [name] VARCHAR(200) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Vendor_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Vendor_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Vendor_code_key] UNIQUE NONCLUSTERED ([code])
);

-- CreateTable
CREATE TABLE [dbo].[Item] (
    [id] NVARCHAR(1000) NOT NULL,
    [code] VARCHAR(64) NOT NULL,
    [name] VARCHAR(200) NOT NULL,
    [uom] VARCHAR(32),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Item_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Item_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Item_code_key] UNIQUE NONCLUSTERED ([code])
);

-- CreateTable
CREATE TABLE [dbo].[Warehouse] (
    [id] NVARCHAR(1000) NOT NULL,
    [code] VARCHAR(32) NOT NULL,
    [name] VARCHAR(200) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Warehouse_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Warehouse_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Warehouse_code_key] UNIQUE NONCLUSTERED ([code])
);

-- CreateTable
CREATE TABLE [dbo].[SalesOrder] (
    [id] NVARCHAR(1000) NOT NULL,
    [orderNo] VARCHAR(32) NOT NULL,
    [customerId] NVARCHAR(1000) NOT NULL,
    [orderDate] DATETIME2 NOT NULL,
    [status] VARCHAR(16) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [SalesOrder_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [SalesOrder_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [SalesOrder_orderNo_key] UNIQUE NONCLUSTERED ([orderNo])
);

-- CreateTable
CREATE TABLE [dbo].[SalesOrderLine] (
    [id] NVARCHAR(1000) NOT NULL,
    [salesOrderId] NVARCHAR(1000) NOT NULL,
    [itemId] NVARCHAR(1000) NOT NULL,
    [qty] DECIMAL(18,2) NOT NULL,
    [unitPrice] DECIMAL(18,2) NOT NULL,
    [amount] DECIMAL(18,2) NOT NULL,
    CONSTRAINT [SalesOrderLine_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[PurchaseOrder] (
    [id] NVARCHAR(1000) NOT NULL,
    [poNo] VARCHAR(32) NOT NULL,
    [vendorId] NVARCHAR(1000) NOT NULL,
    [orderDate] DATETIME2 NOT NULL,
    [status] VARCHAR(16) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [PurchaseOrder_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [PurchaseOrder_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [PurchaseOrder_poNo_key] UNIQUE NONCLUSTERED ([poNo])
);

-- CreateTable
CREATE TABLE [dbo].[PurchaseOrderLine] (
    [id] NVARCHAR(1000) NOT NULL,
    [purchaseOrderId] NVARCHAR(1000) NOT NULL,
    [itemId] NVARCHAR(1000) NOT NULL,
    [qty] DECIMAL(18,2) NOT NULL,
    [unitCost] DECIMAL(18,2) NOT NULL,
    [amount] DECIMAL(18,2) NOT NULL,
    CONSTRAINT [PurchaseOrderLine_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[InventoryTransaction] (
    [id] NVARCHAR(1000) NOT NULL,
    [itemId] NVARCHAR(1000) NOT NULL,
    [warehouseId] NVARCHAR(1000) NOT NULL,
    [txDate] DATETIME2 NOT NULL,
    [txType] VARCHAR(16) NOT NULL,
    [qty] DECIMAL(18,2) NOT NULL,
    [unitCost] DECIMAL(18,2) NOT NULL,
    CONSTRAINT [InventoryTransaction_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [SalesOrderLine_salesOrderId_idx] ON [dbo].[SalesOrderLine]([salesOrderId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PurchaseOrderLine_purchaseOrderId_idx] ON [dbo].[PurchaseOrderLine]([purchaseOrderId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [InventoryTransaction_itemId_warehouseId_idx] ON [dbo].[InventoryTransaction]([itemId], [warehouseId]);

-- AddForeignKey
ALTER TABLE [dbo].[SalesOrder] ADD CONSTRAINT [SalesOrder_customerId_fkey] FOREIGN KEY ([customerId]) REFERENCES [dbo].[Customer]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[SalesOrderLine] ADD CONSTRAINT [SalesOrderLine_salesOrderId_fkey] FOREIGN KEY ([salesOrderId]) REFERENCES [dbo].[SalesOrder]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[SalesOrderLine] ADD CONSTRAINT [SalesOrderLine_itemId_fkey] FOREIGN KEY ([itemId]) REFERENCES [dbo].[Item]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[PurchaseOrder] ADD CONSTRAINT [PurchaseOrder_vendorId_fkey] FOREIGN KEY ([vendorId]) REFERENCES [dbo].[Vendor]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[PurchaseOrderLine] ADD CONSTRAINT [PurchaseOrderLine_purchaseOrderId_fkey] FOREIGN KEY ([purchaseOrderId]) REFERENCES [dbo].[PurchaseOrder]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[PurchaseOrderLine] ADD CONSTRAINT [PurchaseOrderLine_itemId_fkey] FOREIGN KEY ([itemId]) REFERENCES [dbo].[Item]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[InventoryTransaction] ADD CONSTRAINT [InventoryTransaction_itemId_fkey] FOREIGN KEY ([itemId]) REFERENCES [dbo].[Item]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[InventoryTransaction] ADD CONSTRAINT [InventoryTransaction_warehouseId_fkey] FOREIGN KEY ([warehouseId]) REFERENCES [dbo].[Warehouse]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
