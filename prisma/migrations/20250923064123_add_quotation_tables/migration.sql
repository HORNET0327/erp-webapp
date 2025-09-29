BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[SalesOrder] DROP CONSTRAINT [SalesOrder_customerId_fkey];

-- CreateTable
CREATE TABLE [dbo].[Quotation] (
    [id] NVARCHAR(1000) NOT NULL,
    [quotationNo] VARCHAR(32) NOT NULL,
    [orderId] NVARCHAR(1000) NOT NULL,
    [customerId] NVARCHAR(1000) NOT NULL,
    [authorId] NVARCHAR(1000) NOT NULL,
    [version] INT NOT NULL CONSTRAINT [Quotation_version_df] DEFAULT 1,
    [status] VARCHAR(16) NOT NULL,
    [quotationName] VARCHAR(200),
    [paymentDeadline] VARCHAR(100),
    [validityPeriod] VARCHAR(100),
    [deliveryLocation] VARCHAR(500),
    [paymentTerms] VARCHAR(200),
    [author] VARCHAR(100),
    [remarks] VARCHAR(1000),
    [subtotal] DECIMAL(18,2) NOT NULL,
    [taxRate] DECIMAL(5,2) NOT NULL CONSTRAINT [Quotation_taxRate_df] DEFAULT 10.00,
    [taxAmount] DECIMAL(18,2) NOT NULL,
    [totalAmount] DECIMAL(18,2) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Quotation_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [sentAt] DATETIME2,
    [expiresAt] DATETIME2,
    CONSTRAINT [Quotation_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Quotation_quotationNo_key] UNIQUE NONCLUSTERED ([quotationNo])
);

-- CreateTable
CREATE TABLE [dbo].[QuotationVersion] (
    [id] NVARCHAR(1000) NOT NULL,
    [quotationId] NVARCHAR(1000) NOT NULL,
    [version] INT NOT NULL,
    [status] VARCHAR(16) NOT NULL,
    [changes] VARCHAR(2000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [QuotationVersion_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [createdBy] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [QuotationVersion_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [QuotationVersion_quotationId_version_key] UNIQUE NONCLUSTERED ([quotationId],[version])
);

-- CreateTable
CREATE TABLE [dbo].[QuotationEmail] (
    [id] NVARCHAR(1000) NOT NULL,
    [quotationId] NVARCHAR(1000) NOT NULL,
    [sentTo] VARCHAR(200) NOT NULL,
    [sentToName] VARCHAR(100),
    [subject] VARCHAR(200),
    [message] VARCHAR(1000),
    [status] VARCHAR(16) NOT NULL,
    [sentAt] DATETIME2 NOT NULL CONSTRAINT [QuotationEmail_sentAt_df] DEFAULT CURRENT_TIMESTAMP,
    [deliveredAt] DATETIME2,
    [errorMessage] VARCHAR(500),
    CONSTRAINT [QuotationEmail_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Quotation_orderId_idx] ON [dbo].[Quotation]([orderId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Quotation_customerId_idx] ON [dbo].[Quotation]([customerId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Quotation_status_idx] ON [dbo].[Quotation]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Quotation_createdAt_idx] ON [dbo].[Quotation]([createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [QuotationVersion_quotationId_idx] ON [dbo].[QuotationVersion]([quotationId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [QuotationVersion_createdAt_idx] ON [dbo].[QuotationVersion]([createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [QuotationEmail_quotationId_idx] ON [dbo].[QuotationEmail]([quotationId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [QuotationEmail_sentAt_idx] ON [dbo].[QuotationEmail]([sentAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [QuotationEmail_status_idx] ON [dbo].[QuotationEmail]([status]);

-- AddForeignKey
ALTER TABLE [dbo].[SalesOrder] ADD CONSTRAINT [SalesOrder_customerId_fkey] FOREIGN KEY ([customerId]) REFERENCES [dbo].[Customer]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Quotation] ADD CONSTRAINT [Quotation_orderId_fkey] FOREIGN KEY ([orderId]) REFERENCES [dbo].[SalesOrder]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Quotation] ADD CONSTRAINT [Quotation_customerId_fkey] FOREIGN KEY ([customerId]) REFERENCES [dbo].[Customer]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Quotation] ADD CONSTRAINT [Quotation_authorId_fkey] FOREIGN KEY ([authorId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[QuotationVersion] ADD CONSTRAINT [QuotationVersion_quotationId_fkey] FOREIGN KEY ([quotationId]) REFERENCES [dbo].[Quotation]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[QuotationEmail] ADD CONSTRAINT [QuotationEmail_quotationId_fkey] FOREIGN KEY ([quotationId]) REFERENCES [dbo].[Quotation]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
