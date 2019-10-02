IF EXISTS (SELECT * FROM sys.objects so
		   INNER JOIN sys.schemas ss ON so.schema_id = ss.schema_id
		   WHERE so.type = 'V'
		   AND so.NAME = 'RequestSlotTimesView'
		   AND ss.name = 'Service')
DROP VIEW  Service.RequestSlotTimesView
GO

CREATE VIEW Service.RequestSlotTimesView
--------------------------------------------------------------------------------
--
-- Project      : CoSACS .NET
-- File Name    : Service.RequestSlotTimesView.sql
-- File Type    : View
-- Title        : Return Slot Start and End times for a Service Request
-- Author       : IP/JC
-- Date         : 11/09/13
--
--
-- Change Control
-- --------------
-- Date      By  Description
-- ----      --  -----------
--------------------------------------------------------------------------------

AS

select b.RequestId, case when cast((cast(left(t.StartTime,2) as int) * 60 + cast(right(t.StartTime,2) as int) + (b.Slot*((cast(left(t.EndTime,2) as int) - cast(left(t.StartTime,2) as int)) * 60 + (cast(right(t.EndTime,2) as int) - cast(right(t.StartTime,2) as int))) / t.Slots)) / 60 as int) < 10
	then '0'+ cast((cast(left(t.StartTime,2) as int) * 60 + cast(right(t.StartTime,2) as int) + (b.Slot*((cast(left(t.EndTime,2) as int) - cast(left(t.StartTime,2) as int)) * 60 + (cast(right(t.EndTime,2) as int) - cast(right(t.StartTime,2) as int))) / t.Slots)) / 60 as varchar(2)) + ':'
	else cast((cast(left(t.StartTime,2) as int) * 60 + cast(right(t.StartTime,2) as int) + (b.Slot*((cast(left(t.EndTime,2) as int) - cast(left(t.StartTime,2) as int)) * 60 + (cast(right(t.EndTime,2) as int) - cast(right(t.StartTime,2) as int))) / t.Slots)) / 60 as varchar(2)) + ':' end +

case when cast((cast(left(t.StartTime,2) as int) * 60 + cast(right(t.StartTime,2) as int) + (b.Slot*((cast(left(t.EndTime,2) as int) - cast(left(t.StartTime,2) as int)) * 60 + (cast(right(t.EndTime,2) as int) - cast(right(t.StartTime,2) as int))) / t.Slots)) % 60 as int) < 10
	then '0'+ cast((cast(left(t.StartTime,2) as int) * 60 + cast(right(t.StartTime,2) as int) + (b.Slot*((cast(left(t.EndTime,2) as int) - cast(left(t.StartTime,2) as int)) * 60 + (cast(right(t.EndTime,2) as int) - cast(right(t.StartTime,2) as int))) / t.Slots)) % 60 as varchar(2)) +':'
	else cast((cast(left(t.StartTime,2) as int) * 60 + cast(right(t.StartTime,2) as int) + (b.Slot*((cast(left(t.EndTime,2) as int) - cast(left(t.StartTime,2) as int)) * 60 + (cast(right(t.EndTime,2) as int) - cast(right(t.StartTime,2) as int))) / t.Slots)) % 60 as varchar(2))
	end as SlotStartTime,

case when cast(((cast(left(t.StartTime,2) as int) * 60 + cast(right(t.StartTime,2) as int) + (b.Slot*((cast(left(t.EndTime,2) as int) - cast(left(t.StartTime,2) as int)) * 60 + (cast(right(t.EndTime,2) as int) - cast(right(t.StartTime,2) as int))) / t.Slots)) + 
((b.SlotExtend+1) * ((cast(left(t.EndTime,2) as int) - cast(left(t.StartTime,2) as int)) * 60 + (cast(right(t.EndTime,2) as int) - cast(right(t.StartTime,2) as int))) / t.Slots)) /60 as int) < 10
	then '0' + cast(((cast(left(t.StartTime,2) as int) * 60 + cast(right(t.StartTime,2) as int) + (b.Slot*((cast(left(t.EndTime,2) as int) - cast(left(t.StartTime,2) as int)) * 60 + (cast(right(t.EndTime,2) as int) - cast(right(t.StartTime,2) as int))) / t.Slots)) + 
((b.SlotExtend+1) * ((cast(left(t.EndTime,2) as int) - cast(left(t.StartTime,2) as int)) * 60 + (cast(right(t.EndTime,2) as int) - cast(right(t.StartTime,2) as int))) / t.Slots)) /60 as varchar(2)) + ':'
	else cast(((cast(left(t.StartTime,2) as int) * 60 + cast(right(t.StartTime,2) as int) + (b.Slot*((cast(left(t.EndTime,2) as int) - cast(left(t.StartTime,2) as int)) * 60 + (cast(right(t.EndTime,2) as int) - cast(right(t.StartTime,2) as int))) / t.Slots)) + 
((b.SlotExtend+1) * ((cast(left(t.EndTime,2) as int) - cast(left(t.StartTime,2) as int)) * 60 + (cast(right(t.EndTime,2) as int) - cast(right(t.StartTime,2) as int))) / t.Slots)) /60 as varchar(2)) + ':' end +

--Slot End Mins
case when cast(floor(((cast(left(t.StartTime,2) as int) * 60 + cast(right(t.StartTime,2) as int) + (b.Slot*((cast(left(t.EndTime,2) as int) - cast(left(t.StartTime,2) as int)) * 60 + (cast(right(t.EndTime,2) as int) - cast(right(t.StartTime,2) as int))) / t.Slots)) + 
((b.SlotExtend + 1) * ((cast(left(t.EndTime,2) as int) - cast(left(t.StartTime,2) as int)) * 60.00 + (cast(right(t.EndTime,2) as int) - cast(right(t.StartTime,2) as int))) / t.Slots))% 60) as int) < 10 
	then '0' +cast(floor(((cast(left(t.StartTime,2) as int) * 60 + cast(right(t.StartTime,2) as int) + (b.Slot*((cast(left(t.EndTime,2) as int) - cast(left(t.StartTime,2) as int)) * 60 + (cast(right(t.EndTime,2) as int) - cast(right(t.StartTime,2) as int))) / t.Slots)) + 
((b.SlotExtend + 1) * ((cast(left(t.EndTime,2) as int) - cast(left(t.StartTime,2) as int)) * 60.00 + (cast(right(t.EndTime,2) as int) - cast(right(t.StartTime,2) as int))) / t.Slots))% 60) as varchar(2)) 
	else cast(floor(((cast(left(t.StartTime,2) as int) * 60 + cast(right(t.StartTime,2) as int) + (b.Slot*((cast(left(t.EndTime,2) as int) - cast(left(t.StartTime,2) as int)) * 60 + (cast(right(t.EndTime,2) as int) - cast(right(t.StartTime,2) as int))) / t.Slots)) + 
((b.SlotExtend + 1) * ((cast(left(t.EndTime,2) as int) - cast(left(t.StartTime,2) as int)) * 60.00 + (cast(right(t.EndTime,2) as int) - cast(right(t.StartTime,2) as int))) / t.Slots))% 60) as varchar(2))
	end as SlotEndTime

from service.TechnicianBooking b inner join Service.Technician t on t.UserId = b.UserId

