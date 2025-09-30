import pandas as pd, requests, calendar, time
from io import StringIO

BASE = "https://data.cityofnewyork.us/resource/qgea-i56i.csv"
SELECT = "cmplnt_fr_dt,boro_nm,addr_pct_cd,ofns_desc,law_cat_cd,crm_atpt_cptd_cd,latitude,longitude"
PAGE = 50000
START_YEAR, END_YEAR = 2020, 2025
OUT = "nypd_monthly.csv"

with open(OUT, "w") as f_out:
    first = True
    for y in range(START_YEAR, END_YEAR+1):
        mmax = 12 if y < END_YEAR else 9 
        for m in range(1, mmax+1):
            days = calendar.monthrange(y,m)[1]
            start = f"{y:04d}-{m:02d}-01T00:00:00"
            end   = f"{y:04d}-{m:02d}-{days:02d}T23:59:59"
            offset = 0
            while True:
                url = (f"{BASE}?$select={SELECT}"
                       f"&$where=cmplnt_fr_dt between '{start}' and '{end}'"
                       f"&$limit={PAGE}&$offset={offset}")
                r = requests.get(url, timeout=120)
                if not r.text.strip(): break
                df = pd.read_csv(StringIO(r.text))
                if df.empty: break
                df.to_csv(f_out, index=False, header=first, mode='a')
                first = False
                print(f"{y}-{m:02d} +{len(df)}")
                if len(df) < PAGE: break
                offset += PAGE
                time.sleep(0.5)
