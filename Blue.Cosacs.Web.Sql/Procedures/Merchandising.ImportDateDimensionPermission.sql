IF EXISTS(SELECT * FROM sys.database_principals WHERE name ='IIS APPPOOL\CosacsWebServerAppPool')

BEGIN
 GRANT EXECUTE ON [Merchandising].[ImportDateDimension] TO [IIS APPPOOL\CosacsWebServerAppPool]
 GRANT ALTER ON [Merchandising].[Dates] TO [IIS APPPOOL\CosacsWebServerAppPool]
END