BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[ActivityLog] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [action] VARCHAR(50) NOT NULL,
    [entityType] VARCHAR(50) NOT NULL,
    [entityId] VARCHAR(50),
    [description] VARCHAR(500) NOT NULL,
    [metadata] VARCHAR(1000),
    [timestamp] DATETIME2 NOT NULL CONSTRAINT [ActivityLog_timestamp_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ActivityLog_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ActivityLog_userId_idx] ON [dbo].[ActivityLog]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ActivityLog_timestamp_idx] ON [dbo].[ActivityLog]([timestamp]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ActivityLog_action_idx] ON [dbo].[ActivityLog]([action]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ActivityLog_entityType_idx] ON [dbo].[ActivityLog]([entityType]);

-- AddForeignKey
ALTER TABLE [dbo].[ActivityLog] ADD CONSTRAINT [ActivityLog_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
