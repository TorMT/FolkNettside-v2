import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

test("Pages Theme Studio browser smoke polls the real async status, not a premature DOM snapshot",()=>{
 const yaml=readFileSync(new URL("../.github/workflows/pages.yml",import.meta.url),"utf8");
 const start=yaml.indexOf("      - name: Theme Studio image mode browser smoke");
 const end=yaml.indexOf("      - name: Gunnerus GLB browser smoke",start);
 assert.ok(start>=0&&end>start);
 const block=yaml.slice(start,end);
 assert.match(block,/chromedriver --port=9515/);
 assert.match(block,/test_hydro_worker_browser\.py/);
 assert.match(block,/theme-image-smoke\.html/);
 assert.match(block,/trap 'kill "\$server_pid" "\$driver_pid"/);
 assert.doesNotMatch(block,/--dump-dom|--virtual-time-budget=|grep -q 'data-status="pass"'/);
});
test("the shared WebDriver helper waits for pass, fails on explicit failure and times out",()=>{
 const driver=readFileSync(new URL("../scripts/test_hydro_worker_browser.py",import.meta.url),"utf8");
 assert.match(driver,/latest\.get\("status"\)=="pass"/);
 assert.match(driver,/latest\.get\("status"\)=="fail"/);
 assert.match(driver,/Browser smoke timed out/);
});
