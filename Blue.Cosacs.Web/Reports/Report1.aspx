<%@ Page Title="" Language="C#" MasterPageFile="~/Reports/Reports.Master" AutoEventWireup="true" CodeBehind="Report1.aspx.cs" Inherits="Blue.Cosacs.Web.WebForm2" %>
<%@ Register assembly="Microsoft.ReportViewer.WebForms, Version=10.0.0.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a" namespace="Microsoft.Reporting.WebForms" tagprefix="rsweb" %>
<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolder1" runat="server">
    <form id="form1" runat="server">
    <asp:ScriptManager ID="ScriptManager1" runat="server">
    </asp:ScriptManager>
     <rsweb:ReportViewer ID="ReportViewer1" runat="server" Height="500px" 
            ProcessingMode="Remote" Width="100%" BackColor="White" 
        SplitterBackColor="White">
            <ServerReport ReportPath="/Cosacs Reports 4.0/Nett Principle" 
                ReportServerUrl="http://owl/reportserver" />
        </rsweb:ReportViewer>
        <!-- /Cosacs Reports 4.0/Service Reports/Technician Productivity by Category.rdl -->
    </form>
</asp:Content>
