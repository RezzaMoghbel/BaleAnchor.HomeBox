using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;

namespace BaleAnchorUtility.Server.Tests.Integration;

public sealed class ApiWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.ConfigureAppConfiguration((_, configBuilder) =>
        {
            configBuilder.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["SeedAccess:Enabled"] = "true",
                ["SeedAccess:AllowLocalDomainFixedOtp"] = "true",
                ["SeedAccess:FixedOtpCode"] = "123456",

                ["SeedAccess:Accounts:0:Id"] = "seed-superadmin-0001",
                ["SeedAccess:Accounts:0:Email"] = "superadmin@baleanchor.local",
                ["SeedAccess:Accounts:0:Role"] = "SuperAdmin",
                ["SeedAccess:Accounts:0:Status"] = "Active",
                ["SeedAccess:Accounts:0:Surname"] = "Superadmin",
                ["SeedAccess:Accounts:0:DateOfBirth"] = "1980-01-01",
                ["SeedAccess:Accounts:0:FlatNumber"] = "ADMIN-1",
                ["SeedAccess:Accounts:0:MobileNumber"] = "07000000001",

                ["SeedAccess:Accounts:1:Id"] = "seed-admin-0001",
                ["SeedAccess:Accounts:1:Email"] = "admin@baleanchor.local",
                ["SeedAccess:Accounts:1:Role"] = "Admin",
                ["SeedAccess:Accounts:1:Status"] = "Active",
                ["SeedAccess:Accounts:1:Surname"] = "Admin",
                ["SeedAccess:Accounts:1:DateOfBirth"] = "1985-02-02",
                ["SeedAccess:Accounts:1:FlatNumber"] = "ADMIN-2",
                ["SeedAccess:Accounts:1:MobileNumber"] = "07000000002",

                ["SeedAccess:Accounts:2:Id"] = "seed-resident-active-0001",
                ["SeedAccess:Accounts:2:Email"] = "resident.active@baleanchor.local",
                ["SeedAccess:Accounts:2:Role"] = "Resident",
                ["SeedAccess:Accounts:2:Status"] = "Active",
                ["SeedAccess:Accounts:2:Surname"] = "Active",
                ["SeedAccess:Accounts:2:DateOfBirth"] = "1990-03-03",
                ["SeedAccess:Accounts:2:FlatNumber"] = "A101",
                ["SeedAccess:Accounts:2:MobileNumber"] = "07000000003",

                ["SeedAccess:Accounts:3:Id"] = "seed-resident-onboarding-0001",
                ["SeedAccess:Accounts:3:Email"] = "resident.onboarding@baleanchor.local",
                ["SeedAccess:Accounts:3:Role"] = "Resident",
                ["SeedAccess:Accounts:3:Status"] = "TermsPending",
                ["SeedAccess:Accounts:3:Surname"] = "Onboarding",
                ["SeedAccess:Accounts:3:DateOfBirth"] = "1992-04-04",
                ["SeedAccess:Accounts:3:FlatNumber"] = "B202",
                ["SeedAccess:Accounts:3:MobileNumber"] = "07000000004",

                ["SeedAccess:Accounts:4:Id"] = "seed-resident-pending-0001",
                ["SeedAccess:Accounts:4:Email"] = "resident.pending@baleanchor.local",
                ["SeedAccess:Accounts:4:Role"] = "Resident",
                ["SeedAccess:Accounts:4:Status"] = "PendingApproval",
                ["SeedAccess:Accounts:4:Surname"] = "Pending",
                ["SeedAccess:Accounts:4:DateOfBirth"] = "1994-05-05",
                ["SeedAccess:Accounts:4:FlatNumber"] = "C303",
                ["SeedAccess:Accounts:4:MobileNumber"] = "07000000005",

                ["SeedAccess:Accounts:5:Id"] = "seed-resident-rejected-0001",
                ["SeedAccess:Accounts:5:Email"] = "resident.rejected@baleanchor.local",
                ["SeedAccess:Accounts:5:Role"] = "Resident",
                ["SeedAccess:Accounts:5:Status"] = "Rejected",
                ["SeedAccess:Accounts:5:Surname"] = "Rejected",
                ["SeedAccess:Accounts:5:DateOfBirth"] = "1995-06-06",
                ["SeedAccess:Accounts:5:FlatNumber"] = "D404",
                ["SeedAccess:Accounts:5:MobileNumber"] = "07000000006",

                ["SeedAccess:Accounts:6:Id"] = "seed-resident-suspended-0001",
                ["SeedAccess:Accounts:6:Email"] = "resident.suspended@baleanchor.local",
                ["SeedAccess:Accounts:6:Role"] = "Resident",
                ["SeedAccess:Accounts:6:Status"] = "Suspended",
                ["SeedAccess:Accounts:6:Surname"] = "Suspended",
                ["SeedAccess:Accounts:6:DateOfBirth"] = "1996-07-07",
                ["SeedAccess:Accounts:6:FlatNumber"] = "E505",
                ["SeedAccess:Accounts:6:MobileNumber"] = "07000000007",
            });
        });
    }
}
