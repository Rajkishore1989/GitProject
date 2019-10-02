IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[service].[PendingHolidaysNameView]'))
DROP VIEW  service.PendingHolidaysNameView
Go

CREATE VIEW Service.PendingHolidaysNameView
AS
SELECT h.Id ,
        h.UserId ,
        h.StartDate ,
        h.EndDate ,
        h.Approved,
        FullName
  FROM Service.Holiday h
  INNER JOIN admin.[User] ON h.UserId = Admin.[User].Id
GO