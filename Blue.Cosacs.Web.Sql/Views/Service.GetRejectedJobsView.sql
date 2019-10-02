IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[service].[GetRejectedJobsView]'))
DROP VIEW  service.GetRejectedJobsView
Go

CREATE VIEW Service.GetRejectedJobsView
AS
SELECT t.[Id],
      [UserId],
      [RequestId],
      [Date],
      [AllocatedOn],
      t.Reject,
      FullName,
      r.Type,
      CreatedOn,
      LastUpdatedOn
  FROM [Service].[TechnicianBooking] t
  INNER JOIN admin.[User] ON t.UserId = Admin.[User].Id
  INNER JOIN Service.Request r ON t.RequestId = r.Id
GO