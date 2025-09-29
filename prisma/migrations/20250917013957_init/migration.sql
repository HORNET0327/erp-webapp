/*
  Warnings:

  - Added the required column `totalAmount` to the `PurchaseOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAmount` to the `SalesOrder` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[InventoryTransaction] DROP CONSTRAINT [InventoryTransaction_itemId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[InventoryTransaction] DROP CONSTRAINT [InventoryTransaction_warehouseId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[PurchaseOrderLine] DROP CONSTRAINT [PurchaseOrderLine_itemId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[SalesOrderLine] DROP CONSTRAINT [SalesOrderLine_itemId_fkey];

-- AlterTable
ALTER TABLE [dbo].[Customer] ADD [address] VARCHAR(500),
[email] VARCHAR(200),
[phone] VARCHAR(50);

-- AlterTable
ALTER TABLE [dbo].[InventoryTransaction] ADD [expiryDate] DATETIME2,
[lotNo] VARCHAR(50),
[reference] VARCHAR(100),
[serialNo] VARCHAR(100);

-- AlterTable
ALTER TABLE [dbo].[Item] ADD [brandId] NVARCHAR(1000),
[categoryId] NVARCHAR(1000),
[hasSerial] BIT NOT NULL CONSTRAINT [Item_hasSerial_df] DEFAULT 0,
[leadTime] INT,
[minStock] DECIMAL(18,2),
[model] VARCHAR(100),
[spec] VARCHAR(500);

-- AlterTable
ALTER TABLE [dbo].[PurchaseOrder] ADD [totalAmount] DECIMAL(18,2) NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[SalesOrder] ADD [totalAmount] DECIMAL(18,2) NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[Vendor] ADD [address] VARCHAR(500),
[email] VARCHAR(200),
[phone] VARCHAR(50);

-- AlterTable
ALTER TABLE [dbo].[Warehouse] ADD [address] VARCHAR(500);

-- CreateTable
CREATE TABLE [dbo].[Brand] (
    [id] NVARCHAR(1000) NOT NULL,
    [code] VARCHAR(32) NOT NULL,
    [name] VARCHAR(100) NOT NULL,
    [country] VARCHAR(50),
    [website] VARCHAR(200),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Brand_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Brand_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Brand_code_key] UNIQUE NONCLUSTERED ([code])
);

-- CreateTable
CREATE TABLE [dbo].[Category] (
    [id] NVARCHAR(1000) NOT NULL,
    [code] VARCHAR(32) NOT NULL,
    [name] VARCHAR(100) NOT NULL,
    [parentId] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Category_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Category_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Category_code_key] UNIQUE NONCLUSTERED ([code])
);

-- CreateTable
CREATE TABLE [dbo].[SerialNumber] (
    [id] NVARCHAR(1000) NOT NULL,
    [itemId] NVARCHAR(1000) NOT NULL,
    [serialNo] VARCHAR(100) NOT NULL,
    [status] VARCHAR(16) NOT NULL,
    [soldDate] DATETIME2,
    [soldTo] VARCHAR(100),
    [warrantyExp] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [SerialNumber_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [SerialNumber_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [SerialNumber_serialNo_key] UNIQUE NONCLUSTERED ([serialNo])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [SerialNumber_itemId_idx] ON [dbo].[SerialNumber]([itemId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [SerialNumber_status_idx] ON [dbo].[SerialNumber]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [InventoryTransaction_serialNo_idx] ON [dbo].[InventoryTransaction]([serialNo]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [InventoryTransaction_lotNo_idx] ON [dbo].[InventoryTransaction]([lotNo]);

-- AddForeignKey
ALTER TABLE [dbo].[Category] ADD CONSTRAINT [Category_parentId_fkey] FOREIGN KEY ([parentId]) REFERENCES [dbo].[Category]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Item] ADD CONSTRAINT [Item_categoryId_fkey] FOREIGN KEY ([categoryId]) REFERENCES [dbo].[Category]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Item] ADD CONSTRAINT [Item_brandId_fkey] FOREIGN KEY ([brandId]) REFERENCES [dbo].[Brand]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[SalesOrderLine] ADD CONSTRAINT [SalesOrderLine_itemId_fkey] FOREIGN KEY ([itemId]) REFERENCES [dbo].[Item]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PurchaseOrderLine] ADD CONSTRAINT [PurchaseOrderLine_itemId_fkey] FOREIGN KEY ([itemId]) REFERENCES [dbo].[Item]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[InventoryTransaction] ADD CONSTRAINT [InventoryTransaction_itemId_fkey] FOREIGN KEY ([itemId]) REFERENCES [dbo].[Item]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[InventoryTransaction] ADD CONSTRAINT [InventoryTransaction_warehouseId_fkey] FOREIGN KEY ([warehouseId]) REFERENCES [dbo].[Warehouse]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[SerialNumber] ADD CONSTRAINT [SerialNumber_itemId_fkey] FOREIGN KEY ([itemId]) REFERENCES [dbo].[Item]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
