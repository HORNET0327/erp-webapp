BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[PurchaseOrder] ADD [buyerId] NVARCHAR(1000),
[notes] VARCHAR(500),
[requiredDate] DATETIME2;

-- AlterTable
ALTER TABLE [dbo].[SalesOrder] ADD [notes] VARCHAR(500),
[requiredDate] DATETIME2,
[salespersonId] NVARCHAR(1000);

-- AddForeignKey
ALTER TABLE [dbo].[SalesOrder] ADD CONSTRAINT [SalesOrder_salespersonId_fkey] FOREIGN KEY ([salespersonId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PurchaseOrder] ADD CONSTRAINT [PurchaseOrder_buyerId_fkey] FOREIGN KEY ([buyerId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
