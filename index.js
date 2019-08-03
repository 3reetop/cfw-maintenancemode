const config = {
  script_version: "1.0.0",
  script_github: "https://github.com/xDrixxyz/cfw-maintenancemode",
  force_enable_maintenance: false,
  force_enable_downtime: false,
  statuspage: "https://status.example.com",
  statuspage_id: "insert your statuspage.io page id here",
  enable_discord_logging: true,
  discord_webhook:
    "insert discord webhook url here"
};

const MAINTENANCE_PAGE_HTML =
  "<h1>We're undergoing some maintenance!</h1><p>We'll be back as soon as possible. In the meantime, if you want to instantly know when we'll be back, go stalk our <a href='" +
  config.statuspage +
  "'>status page</a></p><br><br><h5>Powered by <a href='" +
  config.script_github +
  "'>cfw-maintenancemode</a> v" +
  config.script_version +
  "</h5>";
const DOWNTIME_PAGE_HTML =
  "<h1>We're experiencing some turbulence</h1><p>Looks like we're experiencing a service outage. While we get our trained team of monkeys on this, stay tuned to our <a href='" +
  config.statuspage +
  "'>status page</a> for important updates</p><br><br><h5>Powered by <a href='" +
  config.script_github +
  "'>cfw-maintenancemode</a> v" +
  config.script_version +
  "</h5>";

async function handleRequest(request) {
  const init = {
    headers: {
      "content-type": type
    }
  };

  if (config.enable_discord_logging) {
    var maintenance_forced =
      config.force_enable_maintenance == true ? "Yes" : "No";
    var downtime_forced = config.force_enable_downtime == true ? "Yes" : "No";
    var asn, colo, ip, urlpath, reqmeth;
    try {
      asn = request.cf.asn;
      colo = request.cf.colo;
    } catch (e) {
      asn = "000000";
      colo = "Unknown";
    }
    if (request.headers.has("CF-Connecting-IP")) {
      ip = request.headers.get("CF-Connecting-IP");
    } else {
      ip = "Unknown";
    }
    if (
      request.url !== "" ||
      request.url !== undefined ||
      request.url !== null
    ) {
      urlpath = request.url;
    } else {
      urlpath = "Unknown";
    }
    if (
      request.method !== "" ||
      request.method !== undefined ||
      request.method !== null
    ) {
      reqmeth = request.method;
    } else {
      reqmeth = "Unknown";
    }
    const init2_body = {
      content: "Incoming request!",
      embeds: [
        {
          title: "Request Log",
          description:
            "Processing incoming request to origin\n\n**Is maintenance force-enabled?**: `" +
            maintenance_forced +
            "`\n**Is downtime force-enabled?**: `" +
            downtime_forced +
            "`",
          color: 11001111,
          fields: [
            {
              name: "Method",
              value: reqmeth,
              inline: true
            },
            {
              name: "URL",
              value: "`" + urlpath + "`",
              inline: true
            },
            {
              name: "IP",
              value: ip,
              inline: true
            },
            {
              name: "CF Datacenter",
              value: colo,
              inline: true
            },
            {
              name: "ASN",
              value: "AS" + asn,
              inline: true
            }
          ],
          footer: {
            icon_url:
              "https://www.logoglo.com/wp-content/uploads/2018/08/cloudflare-logo-min.jpg",
            text: "Powered by Cloudflare Workers"
          }
        }
      ]
    };
    const init2 = {
      body: JSON.stringify(init2_body),
      method: "POST",
      headers: {
        "content-type": "application/json"
      }
    };
    const webhook_resp = await Promise.all([fetch(url2, init2)]).catch(err => {
      console.log("Something happened...");
    });
  }
  const responses = await Promise.all([fetch(url1, init)]).catch(err => {
    return new Response(config.downtime_page, {
      status: 500,
      headers: { "content-type": "text/html" }
    });
  });
  const results = await Promise.all([gatherResponse(responses[0])]).catch(
    err => {
      return new Response(config.downtime_page, {
        status: 500,
        headers: { "content-type": "text/html" }
      });
    }
  );
  if (results[0].status.indicator == "maintenance") {
    return new Response(MAINTENANCE_PAGE_HTML, {
      status: 503,
      headers: { "content-type": "text/html" }
    });
  } else {
    if (
      results[0].status.indicator == "major" ||
      results[0].status.indicator == "minor"
    ) {
      return new Response(DOWNTIME_PAGE_HTML, {
        status: 500,
        headers: { "content-type": "text/html" }
      });
    } else {
      if (config.force_enable_maintenance) {
        return new Response(MAINTENANCE_PAGE_HTML, {
          status: 503,
          headers: { "content-type": "text/html" }
        });
      } else if (config.force_enable_downtime) {
        return new Response(DOWNTIME_PAGE_HTML, {
          status: 500,
          headers: { "content-type": "text/html" }
        });
      } else {
        return fetch(request);
      }
    }
  }
}
addEventListener("fetch", event => {
  return event.respondWith(handleRequest(event.request));
});
/**
 * gatherResponse awaits and returns a response body as a string.
 * Use await gatherResponse(..) in an async function to get the response body
 * @param {Response} response
 */
async function gatherResponse(response) {
  const { headers } = response;
  const contentType = headers.get("content-type");
  if (contentType.includes("application/json")) {
    return await response.json();
  } else if (contentType.includes("application/text")) {
    return await response.text();
  } else if (contentType.includes("text/html")) {
    return await response.text();
  } else {
    return await response.text();
  }
}
const url1 =
  "https://" + config.statuspage_id + ".statuspage.io/api/v2/status.json";
const url2 = config.discord_webhook;
const type = "application/json;charset=UTF-8";