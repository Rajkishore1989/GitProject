/*
View on table SR_Summary.

*/

IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[service].[SummaryView]'))
DROP VIEW  service.[SummaryView]
Go

CREATE VIEW  [Service].[SummaryView]
AS
SELECT *

FROM dbo.SR_Summary		

GO

-- End End End End End End End End End End End End End End End End End End End End End End End End End End End End End End 
