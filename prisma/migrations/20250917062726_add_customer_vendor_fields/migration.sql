BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Customer] ADD [contactPerson] VARCHAR(100),
[isActive] BIT NOT NULL CONSTRAINT [Customer_isActive_df] DEFAULT 1;

-- AlterTable
ALTER TABLE [dbo].[Vendor] ADD [contactPerson] VARCHAR(100),
[isActive] BIT NOT NULL CONSTRAINT [Vendor_isActive_df] DEFAULT 1;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
