using BaleAnchorUtility.Server.Configuration;
using BaleAnchorUtility.Server.Infrastructure.Startup;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace BaleAnchorUtility.Server.Controllers;

[ApiController]
[Route("api/system")]
public sealed class SystemController : ControllerBase
{
    private readonly IHostEnvironment environment;
    private readonly SeedAccessOptions seedAccessOptions;
    private readonly DevelopmentSeedDataService developmentSeedDataService;

    public SystemController(
        IHostEnvironment environment,
        IOptions<SeedAccessOptions> seedAccessOptions,
        DevelopmentSeedDataService developmentSeedDataService)
    {
        this.environment = environment;
        this.seedAccessOptions = seedAccessOptions.Value;
        this.developmentSeedDataService = developmentSeedDataService;
    }

    [HttpGet("ping")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult Ping()
    {
        return Ok(new
        {
            status = "ok",
            timestampUtc = DateTimeOffset.UtcNow.ToString("O"),
        });
    }

    [HttpGet("dev-seed")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult GetDevelopmentSeedStatus()
    {
        if (!developmentSeedDataService.IsAvailable)
        {
            return NotFound(new
            {
                message = "Development seed access is not available.",
            });
        }

        return Ok(new
        {
            enabled = true,
            environment = environment.EnvironmentName,
            fixedOtpCode = seedAccessOptions.FixedOtpCode,
            seedEmails = developmentSeedDataService.SeedEmails,
        });
    }

    [HttpPost("dev-seed")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReseedDevelopmentData(CancellationToken cancellationToken)
    {
        if (!developmentSeedDataService.IsAvailable)
        {
            return NotFound(new
            {
                message = "Development seed access is not available.",
            });
        }

        var result = await developmentSeedDataService.ReseedAsync(cancellationToken);
        return Ok(result);
    }

    [HttpDelete("dev-seed")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteDevelopmentSeedData(CancellationToken cancellationToken)
    {
        if (!developmentSeedDataService.IsAvailable)
        {
            return NotFound(new
            {
                message = "Development seed access is not available.",
            });
        }

        var result = await developmentSeedDataService.ResetSeedDataAsync(cancellationToken);
        return Ok(result);
    }
}
