SET QUOTED_IDENTIFIER ON
GO
SET ANSI_NULLS OFF 
GO

if exists (select * from dbo.sysobjects where id = object_id('[dbo].[DN_LineItemWarrantyFulFilledSP]') and OBJECTPROPERTY(id, 'IsProcedure') = 1)
drop procedure [dbo].[DN_LineItemWarrantyFulFilledSP]
GO

CREATE PROCEDURE 	dbo.DN_LineItemWarrantyFulFilledSP
-- ================================================
-- Project      : CoSACS .NET
-- File Name    : DN_LineItemWarrantyFulFilledSP.sql
-- File Type    : MSSQL Server Stored Procedure Script
-- Title        : Warranty FulFilled 
-- Author       : ??
-- Date         : ??
--
-- This procedure will update Lineitem Details for warranties where the parent item has been collected
-- Change Control
-- --------------
-- Date      By  Description
-- ----      --  -----------
-- 03/06/11 jec  CR1212 RI Integration changes - use ItemID rather than ItemNo
-- 02/06/14 ip   #18813 - No Exchange record was being written for free migrated warranties that do not exist on LineItem
-- ================================================
	-- Add the parameters for the stored procedure here
            @buffno integer,
			@acctno varchar(12),
			@agrmtno int,
			--@itemno varchar(8),
			@itemid int,			-- ParentItemId
			@stocklocn smallint,
			@empeeno int,
			@exchange bit,
			@quantityReturned INT, 
			@collectionType char(1),		-- #17678
			@warrantyFullFilled char(1),		-- #17678
			@return int OUTPUT
AS

	SET 	@return = 0			--initialise return code
    SET NOCOUNT ON  
	DECLARE	@warrantyid int,		-- RI @warrantyno varchar(8),	
			@warrantylocn smallint,
			@contractno varchar(10)
			
	SET	@warrantyid = 0
	SET @warrantylocn = 0
	SET @contractno = ''

	SELECT	@warrantyid = itemid,		-- RI
			@warrantylocn = stocklocn,
			@contractno = contractno
	FROM	lineitem			
	WHERE	acctno = @acctno
	AND		agrmtno = @agrmtno
	--AND		parentitemno = @itemno
	AND		parentitemid = @itemid			-- RI
	AND		parentlocation = @stocklocn
	AND		contractno != ''
	AND 	quantity != 0
	
	----SET ROWCOUNT @quantityreturned
	-- here we are only updating the retuned quantity of warranties as used (tried using top but didn't work
	

	--SET ROWCOUNT  0   -- #16240

	-- #16240 move to before update of lineitem
	--IF(@exchange = 1)    -- #17698
	BEGIN
		INSERT	
		INTO	exchange
				(buffno, acctno, agrmtno, itemno, stocklocn, exchangedate, exchangedby,
				 warrantyno, warrantylocn, contractno,ItemId,WarrantyID, CollectionType,WarrantyGroupId)		-- RI
		
		--VALUES	(@buffno, @acctno, @agrmtno, '', @stocklocn, GETDATE(), @empeeno,
		--		 '', @warrantylocn, @contractno,@itemid,@warrantyid)	-- RI

		SELECT	top(@quantityReturned) @buffno, @acctno, @agrmtno, '', @stocklocn, GETDATE(), @empeeno,		-- #16240
				 '', stocklocn, ws.WarrantyContractNo,@itemid,l.ItemID,@CollectionType,l.WarrantyGroupId	--#18813 		-- #17678
		FROM	lineitem l inner join Warranty.WarrantySale ws on l.acctno=ws.CustomerAccount and @itemId=ws.ItemId --and l.stocklocn=ws.StockLocation 
				--and l.contractno=ws.WarrantyContractNo	
				 and (l.contractno=ws.WarrantyContractNo 
				 or l.contractno+'M'=ws.WarrantyContractNo)	--#18813 - for migrated free warranties that do not exist on lineitem
		WHERE	acctno = @acctno AND agrmtno = @agrmtno
		AND		parentitemid = @itemid			
		AND		parentlocation = @stocklocn
		AND		contractno != ''
		AND 	quantity != 0
		and getdate() between ws.EffectiveDate and dateadd(month,ws.WarrantyLength,ws.EffectiveDate)			-- #17678
		order by l.warrantyGroupId desc					-- #17678
	END	
	
	--if (@WarrantyFullfilled='Y' or @collectionType='E')				-- #17678
	begin
		UPDATE	lineitem
		SET		parentitemid = 0, warrantygroupid=0
				-- parentlocation = 0 leaving parent item no on so hit rate reports can still function removing parent itemno. 
		from    lineitem l, exchange e 
		WHERE	l.acctno = @acctno
		AND		l.agrmtno = @agrmtno
		AND		parentitemid = @itemid		-- RI
		AND		parentlocation = @stocklocn
		AND		l.contractno != ''
		AND 	quantity != 0
		and		e.acctno = @acctno			-- #17678
		AND		e.agrmtno = @agrmtno		-- #17678
		and     e.ItemID=@itemid			-- #17678
		and     e.WarrantyID=l.itemid			-- #17678
		and     e.ContractNo=l.contractno		-- #17678
		
		-- #17677 - delink existing free warranty if replacement is in Extended warranty period
		UPDATE	lineitem
		SET		parentitemid = 0, warrantygroupid=0				
		from    lineitem l inner join Warranty.WarrantySale ws on l.acctno=ws.CustomerAccount and @itemId=ws.ItemId and l.stocklocn=ws.StockLocation 
							and l.contractno=ws.WarrantyContractNo	, exchange e
		WHERE	l.acctno = @acctno
		AND		l.agrmtno = @agrmtno
		AND		l.parentitemid = @itemid		-- RI
		AND		l.parentlocation = @stocklocn
		AND		l.contractno != ''
		AND 	l.quantity != 0
		and		e.acctno = @acctno			
		AND		e.agrmtno = @agrmtno		
		and     e.ItemID=@itemid					
		and     e.ContractNo!=l.contractno		
		and		e.warrantygroupid=l.warrantygroupid	
		and		ws.WarrantyType='F'	
	
	end

	--Update the LinkIrwId if in the free period
	UPDATE Exchange
	SET LinkIrwId = l.ItemId,
		LinkIrwContractno = l.contractno
	FROM Exchange e inner join Lineitem l on
		 e.Acctno = l.acctno and
		 e.agrmtno = l.agrmtno and
		 e.ContractNo != l.contractno and 
		 e.warrantygroupid=l.warrantygroupid	
		 inner join Warranty.WarrantySale ws on e.acctno=ws.CustomerAccount 
		 and e.itemid = ws.itemid 
	WHERE ws.WarrantyType = 'F'

	
	SET	@return = @@error	
	
GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

-- End End End End End End End End End End End End End End End End End End End End End End End End End End End 