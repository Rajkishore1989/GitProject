IF EXISTS (SELECT * FROM SYS.OBJECTS 
           WHERE NAME = 'SplitFunction'
            AND schema_id in (select schema_id from sys.schemas where name = 'Report'))
BEGIN 
DROP FUNCTION Report.SplitFunction
END
GO

CREATE FUNCTION Report.SplitFunction
		(@String varchar(max), @Delimiter char(1))         
		returns @temptable TABLE (item varchar(max))         
as         
begin         
    declare @idx int         
    declare @slice varchar(max)
    set @string=RTRIM(@string)         -- jec 25/02/13 trailing spaces causes erroneous results
        
    select @idx = 1         
        if len(@String)<1 or @String is null  return         
        
    while @idx!= 0         
    begin         
        set @idx = charindex(@Delimiter,@String)         
        if @idx!=0         
            set @slice = left(@String,@idx - 1)         
        else         
            set @slice = @String         
            
        if(len(@slice)>0)    
            insert into @temptable(Item) values(@slice)         
    
        set @String = right(@String,len(@String) - @idx)         
        if len(@String) = 0 break         
    end     
return         
end 

GO 