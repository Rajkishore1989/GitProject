IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[RepossessedProductConditionView]'))
DROP VIEW  [Merchandising].[RepossessedProductConditionView]
GO

CREATE VIEW [Merchandising].[RepossessedProductConditionView]
AS
SELECT
	p.Id as ProductId,
	c.Name as Condition
FROM
	[Merchandising].RepossessedProduct p
	JOIN
	[Merchandising].RepossessedCondition c ON c.Id = p.RepossessedConditionId
GO