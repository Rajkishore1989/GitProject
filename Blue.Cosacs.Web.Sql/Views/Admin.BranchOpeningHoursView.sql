if OBJECT_ID('Admin.BranchOpeningHoursView') IS NOT NULL
	DROP VIEW [Admin].BranchOpeningHoursView
GO

CREATE VIEW [Admin].BranchOpeningHoursView
AS
	SELECT b.branchno as BranchNo,
		   b.branchname as BranchName,
		   ab.MondayOpen,
		   ab.MondayClose,
		   ab.TuesdayOpen,
		   ab.TuesdayClose,
		   ab.WednesdayOpen,
		   ab.WednesdayClose,
		   ab.ThursdayOpen,
		   ab.ThursdayClose,
		   ab.FridayOpen,
		   ab.FridayClose,
		   ab.SaturdayOpen,
		   ab.SaturdayClose,
		   ab.SundayOpen,
		   ab.SundayClose
	FROM branch b
	LEFT JOIN [Admin].BranchOpeningHours ab
	ON b.branchno = ab.BranchNumber
