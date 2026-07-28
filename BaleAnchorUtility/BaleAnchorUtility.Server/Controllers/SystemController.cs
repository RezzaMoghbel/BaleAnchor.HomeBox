using Microsoft.AspNetCore.Mvc;

namespace BaleAnchorUtility.Server.Controllers;

[ApiController]
[Route("api/system")]
public sealed class SystemController : ControllerBase
{
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
}
