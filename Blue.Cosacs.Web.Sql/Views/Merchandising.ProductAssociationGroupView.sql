IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[ProductAssociationGroupView]'))
DROP VIEW [Merchandising].[ProductAssociationGroupView]
GO