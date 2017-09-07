using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using devRantNetCore;
using System.Net.Http;

namespace _xmlRant.Controllers
{
    public class HomeController : Controller
    {
        public ViewResult Index()
        {
            this.ViewBag.Sort = "algo";
            if (!string.IsNullOrEmpty(HttpContext.Request.Query["sort"]))
            {
                this.ViewBag.Sort = HttpContext.Request.Query["sort"].ToString();
            }
            return View("Index", "rant");
        }

        public async Task<IActionResult> GetData(string sort, int pageIndex, int pageSize)
        {
            HttpClient httpClient = new HttpClient();
            var devRantClient =  DevRantClient.Create(httpClient);
            Sort s = Sort.Recent;
            sort = sort.ToLower();
            if (sort == "recent") 
            {
                s = Sort.Recent;
            } 
            else if (sort == "top")
            {
                s = Sort.Top;
            }
            else if (sort == "algo")
            {
                s = Sort.Algo;
            }
            var rantResults = await devRantClient.GetRants(s, pageSize, pageIndex * pageSize);
            return Json(rantResults);
        }

        public async Task<IActionResult> GetRant(int rantId)
        {
            HttpClient httpClient = new HttpClient();
            var devRantClient =  DevRantClient.Create(httpClient);
            var rantResult = await devRantClient.GetRant(rantId);
            return Json(rantResult);
        }

        public IActionResult Error()
        {
            return View();
        }
    }
}
