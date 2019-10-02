IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[service].[PublicHolidayView]'))
DROP VIEW  service.PublicHolidayView
Go

CREATE VIEW Service.PublicHolidayView
AS
SELECT * FROM Config.PublicHoliday
GO