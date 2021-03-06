if exists (select * from dbo.sysobjects where id = object_id('[dbo].[DN_CustomerDetailsSP]') and OBJECTPROPERTY(id, 'IsProcedure') = 1)
DROP PROCEDURE [dbo].[DN_CustomerDetailsSP]
GO

	create PROCEDURE 	[dbo].[DN_CustomerDetailsSP] 
			@RequestID nvarchar(12),
			@DELTitleC nvarchar(25) OUT,
			@DELFirstName nvarchar(30) OUT,
			@DELLastName nvarchar(60) OUT,
				@addtype nvarchar (25) OUT,
			@return int OUTPUT
	AS
	SET 	@return = 0	
	begin
	SELECT	@DELTitleC=DELTitleC,
	@DELFirstName=DELFirstName,
	@DELLastName=DELLastname  ,@addtype=r.addtype from
			customer c 
		inner join Service.Request r on r.CustomerId=c.custid 
			 left join custaddress cadd on cadd.custid=r.CustomerId and r.addtype=cadd.addtype
			 		
		WHERE	
			r.Id=@RequestID

			end

				IF (@@error != 0)
		SET @return = @@error