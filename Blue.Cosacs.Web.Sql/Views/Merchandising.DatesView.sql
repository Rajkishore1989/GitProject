IF EXISTS(SELECT * FROM sys.views where object_id = OBJECT_ID(N'[Merchandising].[DatesView]'))
    DROP VIEW [Merchandising].[DatesView]
GO

CREATE VIEW Merchandising.DatesView
AS
    SELECT datekey AS Id, *
    FROM merchandising.Dates
GO