BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[User_Info] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [employeeCode] NVARCHAR(1000),
    [departmentCode] NVARCHAR(1000),
    [jobTitle] NVARCHAR(1000),
    [phone] NVARCHAR(1000),
    [mobile] NVARCHAR(1000),
    [email] NVARCHAR(1000),
    [addressLine1] NVARCHAR(1000),
    [addressLine2] NVARCHAR(1000),
    [city] NVARCHAR(1000),
    [state] NVARCHAR(1000),
    [postalCode] NVARCHAR(1000),
    [country] NVARCHAR(1000),
    [hireDate] DATETIME2,
    [resignDate] DATETIME2,
    [birthDate] DATETIME2,
    [gender] VARCHAR(16),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_Info_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [User_Info_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_Info_userId_key] UNIQUE NONCLUSTERED ([userId]),
    CONSTRAINT [User_Info_employeeCode_key] UNIQUE NONCLUSTERED ([employeeCode])
);

-- AddForeignKey
ALTER TABLE [dbo].[User_Info] ADD CONSTRAINT [User_Info_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
