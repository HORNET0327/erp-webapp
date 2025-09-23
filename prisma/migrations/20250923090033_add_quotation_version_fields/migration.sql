BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[QuotationVersion] ADD [author] VARCHAR(100),
[deliveryLocation] VARCHAR(200),
[paymentDeadline] VARCHAR(100),
[paymentTerms] VARCHAR(200),
[quotationName] VARCHAR(200),
[remarks] VARCHAR(1000),
[subtotal] DECIMAL(18,2),
[taxAmount] DECIMAL(18,2),
[taxRate] DECIMAL(5,2),
[totalAmount] DECIMAL(18,2),
[validityPeriod] VARCHAR(100);

-- AddForeignKey
ALTER TABLE [dbo].[QuotationVersion] ADD CONSTRAINT [QuotationVersion_createdBy_fkey] FOREIGN KEY ([createdBy]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
