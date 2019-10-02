IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Service].[UserProfileView]'))
DROP VIEW  Service.UserProfileView
Go

CREATE VIEW Service.UserProfileView
AS

SELECT a.id, a.UserId, a.ProfileId, ap.Name FROM admin.AdditionalUserProfile a
INNER JOIN admin.AdditionalProfile ap ON a.ProfileId = ap.Id

go