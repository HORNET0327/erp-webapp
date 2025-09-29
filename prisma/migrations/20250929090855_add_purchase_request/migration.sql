BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[PurchaseRequest] (
    [id] NVARCHAR(1000) NOT NULL,
    [requestNo] VARCHAR(32) NOT NULL,
    [vendorId] NVARCHAR(1000) NOT NULL,
    [requesterId] NVARCHAR(1000) NOT NULL,
    [approverId] NVARCHAR(1000),
    [requestDate] DATETIME2 NOT NULL,
    [requiredDate] DATETIME2,
    [status] VARCHAR(20) NOT NULL,
    [totalAmount] DECIMAL(18,2) NOT NULL,
    [notes] VARCHAR(500),
    [reason] VARCHAR(1000),
    [approvedAt] DATETIME2,
    [rejectedAt] DATETIME2,
    [convertedAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [PurchaseRequest_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [PurchaseRequest_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [PurchaseRequest_requestNo_key] UNIQUE NONCLUSTERED ([requestNo])
);

-- CreateTable
CREATE TABLE [dbo].[PurchaseRequestLine] (
    [id] NVARCHAR(1000) NOT NULL,
    [purchaseRequestId] NVARCHAR(1000) NOT NULL,
    [itemId] NVARCHAR(1000) NOT NULL,
    [qty] DECIMAL(18,2) NOT NULL,
    [estimatedCost] DECIMAL(18,2),
    [amount] DECIMAL(18,2) NOT NULL,
    [reason] VARCHAR(500),
    CONSTRAINT [PurchaseRequestLine_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PurchaseRequest_vendorId_idx] ON [dbo].[PurchaseRequest]([vendorId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PurchaseRequest_requesterId_idx] ON [dbo].[PurchaseRequest]([requesterId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PurchaseRequest_status_idx] ON [dbo].[PurchaseRequest]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PurchaseRequest_requestDate_idx] ON [dbo].[PurchaseRequest]([requestDate]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PurchaseRequestLine_purchaseRequestId_idx] ON [dbo].[PurchaseRequestLine]([purchaseRequestId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PurchaseRequestLine_itemId_idx] ON [dbo].[PurchaseRequestLine]([itemId]);

-- AddForeignKey
ALTER TABLE [dbo].[PurchaseRequest] ADD CONSTRAINT [PurchaseRequest_vendorId_fkey] FOREIGN KEY ([vendorId]) REFERENCES [dbo].[Vendor]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PurchaseRequest] ADD CONSTRAINT [PurchaseRequest_requesterId_fkey] FOREIGN KEY ([requesterId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PurchaseRequest] ADD CONSTRAINT [PurchaseRequest_approverId_fkey] FOREIGN KEY ([approverId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PurchaseRequest] ADD CONSTRAINT [PurchaseRequest_id_fkey] FOREIGN KEY ([id]) REFERENCES [dbo].[PurchaseOrder]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[PurchaseRequestLine] ADD CONSTRAINT [PurchaseRequestLine_purchaseRequestId_fkey] FOREIGN KEY ([purchaseRequestId]) REFERENCES [dbo].[PurchaseRequest]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[PurchaseRequestLine] ADD CONSTRAINT [PurchaseRequestLine_itemId_fkey] FOREIGN KEY ([itemId]) REFERENCES [dbo].[Item]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
