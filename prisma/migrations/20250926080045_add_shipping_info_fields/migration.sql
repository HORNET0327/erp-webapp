/*
  Warnings:

  - You are about to drop the column `changes` on the `QuotationVersion` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[PurchaseOrder] ALTER COLUMN [status] VARCHAR(20) NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[QuotationVersion] DROP COLUMN [changes];

-- AlterTable
ALTER TABLE [dbo].[SalesOrder] ALTER COLUMN [status] VARCHAR(20) NOT NULL;
ALTER TABLE [dbo].[SalesOrder] ADD [carrier] VARCHAR(100),
[orderMemo] VARCHAR(1000),
[packagingMethod] VARCHAR(100),
[paymentType] VARCHAR(20),
[shippingMethod] VARCHAR(100);

-- CreateTable
CREATE TABLE [dbo].[QuotationItem] (
    [id] NVARCHAR(1000) NOT NULL,
    [quotationId] NVARCHAR(1000) NOT NULL,
    [itemId] NVARCHAR(1000) NOT NULL,
    [qty] DECIMAL(18,2) NOT NULL,
    [unitPrice] DECIMAL(18,2) NOT NULL,
    [amount] DECIMAL(18,2) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [QuotationItem_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [QuotationItem_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[QuotationVersionChange] (
    [id] NVARCHAR(1000) NOT NULL,
    [quotationVersionId] NVARCHAR(1000) NOT NULL,
    [fieldName] VARCHAR(100) NOT NULL,
    [oldValue] VARCHAR(1000),
    [newValue] VARCHAR(1000),
    [changeType] VARCHAR(20) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [QuotationVersionChange_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [QuotationVersionChange_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [QuotationItem_quotationId_idx] ON [dbo].[QuotationItem]([quotationId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [QuotationItem_itemId_idx] ON [dbo].[QuotationItem]([itemId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [QuotationVersionChange_quotationVersionId_idx] ON [dbo].[QuotationVersionChange]([quotationVersionId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [QuotationVersionChange_fieldName_idx] ON [dbo].[QuotationVersionChange]([fieldName]);

-- AddForeignKey
ALTER TABLE [dbo].[QuotationItem] ADD CONSTRAINT [QuotationItem_quotationId_fkey] FOREIGN KEY ([quotationId]) REFERENCES [dbo].[Quotation]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[QuotationItem] ADD CONSTRAINT [QuotationItem_itemId_fkey] FOREIGN KEY ([itemId]) REFERENCES [dbo].[Item]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[QuotationVersionChange] ADD CONSTRAINT [QuotationVersionChange_quotationVersionId_fkey] FOREIGN KEY ([quotationVersionId]) REFERENCES [dbo].[QuotationVersion]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
