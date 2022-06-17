
VALID_BOARD = [
    ["aircraft carrier", "ocean", "ocean", "ocean", "ocean", "destroyer", "destroyer", "ocean", "ocean", "ocean"],
    ["aircraft carrier", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "destroyer", "ocean"],
    ["aircraft carrier", "ocean", "ocean", "ocean", "cruiser", "cruiser", "cruiser", "ocean", "destroyer", "ocean"],
    ["aircraft carrier", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean"],
    ["aircraft carrier", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean"],
    ["ocean", "ocean", "ocean", "battleship", "battleship", "battleship", "battleship", "ocean", "ocean", "ocean"],
    ["ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean"],
    ["ocean", "submarine", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean"],
    ["ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "submarine", "ocean", "ocean"],
    ["ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean"]
]

VALID_BOARD_2 = [
    ["ocean", "ocean", "ocean", "ocean", "ocean", "destroyer", "destroyer", "ocean", "ocean", "ocean"],
    ["aircraft carrier", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "destroyer", "ocean"],
    ["aircraft carrier", "ocean", "ocean", "ocean", "cruiser", "cruiser", "cruiser", "ocean", "destroyer", "ocean"],
    ["aircraft carrier", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean"],
    ["aircraft carrier", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean"],
    ["aircraft carrier", "ocean", "ocean", "battleship", "battleship", "battleship", "battleship", "ocean", "ocean", "ocean"],
    ["ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean"],
    ["ocean", "submarine", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean"],
    ["ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "submarine", "ocean", "ocean"],
    ["ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean"]
]

INVALID_BOARD_MISSING = [
    ["aircraft carrier", "ocean", "ocean", "ocean", "ocean", "destroyer", "destroyer", "ocean", "ocean", "ocean"],
    ["aircraft carrier", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "destroyer", "ocean"],
    ["aircraft carrier", "ocean", "ocean", "ocean", "cruiser", "cruiser", "cruiser", "ocean", "destroyer", "ocean"],
    ["aircraft carrier", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean"],
    ["aircraft carrier", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean"],
    ["ocean", "ocean", "ocean", "battleship", "battleship", "battleship", "battleship", "ocean", "ocean", "ocean"],
    ["ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean"],
    ["ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean"],
    ["ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "submarine", "ocean", "ocean"],
    ["ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean"]
]
INVALID_BOARD_EXTRA = [
    ["aircraft carrier", "ocean", "ocean", "ocean", "ocean", "battleship", "battleship", "battleship", "battleship", "ocean"],
    ["aircraft carrier", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean"],
    ["aircraft carrier", "ocean", "ocean", "ocean", "cruiser", "cruiser", "cruiser", "ocean", "ocean", "ocean"],
    ["aircraft carrier", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean"],
    ["aircraft carrier", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean"],
    ["ocean", "ocean", "ocean", "battleship", "battleship", "battleship", "battleship", "ocean", "ocean", "ocean"],
    ["ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean"],
    ["ocean", "submarine", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean"],
    ["ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "submarine", "ocean", "ocean"],
    ["ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean"]
]

ACCESS_TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJXWU5yRmhaT25IbUFEY0N0d0x0V\
                lVoY1A4SHNQYU1Rbk1GYnllcHR2VzlnIn0.eyJleHAiOjE2NTUyOTU1MTQsImlhdCI6MTY1NTI5NTI\
                xNCwianRpIjoiNmY1MThhZjctZDg1ZS00OWEwLTgwZjItM2M3N2RhMzg0NDllIiwiaXNzIjoiaHR0c\
                DovL2xvY2FsaG9zdDo2NTQzMi9hdXRoL3JlYWxtcy90ZGYiLCJhdWQiOlsidGRmLWVudGl0bGVtZW50\
                IiwidGRmLWF0dHJpYnV0ZXMiLCJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiI0YTIw\
                YjQ1ZC1iYTAxLTRkM2YtYmNkYS0xY2VkMzA2NDFiMjUiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJkY3It\
                dGVzdCIsInNlc3Npb25fc3RhdGUiOiI3NWZmODg3ZS05M2Q2LTRlMzktOGE5MS03ZGFlODQ5N2RjYjUiL\
                CJhY3IiOiIxIiwiYWxsb3dlZC1vcmlnaW5zIjpbImh0dHA6Ly9sb2NhbGhvc3Q6NjU0MzIiXSwicmVhbG1\
                fYWNjZXNzIjp7InJvbGVzIjpbImRlZmF1bHQtcm9sZXMtdGRmIiwib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfY\
                XV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7InJlYWxtLW1hbmFnZW1lbnQiOnsicm9sZXM\
                iOlsidmlldy11c2VycyIsInZpZXctY2xpZW50cyIsInF1ZXJ5LWNsaWVudHMiLCJxdWVyeS1ncm91cHMiLC\
                JxdWVyeS11c2VycyJdfSwiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY\
                2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJlbWFpbCBwcm9maWxlIiwic2lkIjoi\
                NzVmZjg4N2UtOTNkNi00ZTM5LThhOTEtN2RhZTg0OTdkY2I1IiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLC\
                JwcmVmZXJyZWRfdXNlcm5hbWUiOiJ1c2VyMSJ9.ghXPrwvXtrq1LmQl3XwexkcylgsPIhACKo7B1deqkv1w\
                fHatyPVmcjVy_TDDn7r8wmpSYWppXDTQQoyuOO6IUjDwoKJud7QSgAiKzf3dtVTzbV-5RiC0FjGXK5z3WCXp\
                P23JSCXAjIwipMKd9KIvgWnxp325036KbJIMfcHYe9FBjEOtqIC8VPzwUOPxKQNmiqr3RmZphLkRG6WBiEjSH\
                YHg722eJImJ_DJq2hAC8If2bThy6bg3A2CZ907Jl7WGIQXfOS_EbkRvKySaY2QdOnvFxbB3J3s9NRUHP7mLn\
                RpGeicffqMbYkHeatQzqBfTBCg4_NKuv-10DesUjwxa_A"

REFRESH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJmZTM3NTYxZS05ZTBiLTQ1N2UtODU5Mi1\
                iZjg2NDYzYzI4ZDIifQ.eyJleHAiOjE2NTUyOTcwMTQsImlhdCI6MTY1NTI5NTIxNCwianRpIjoiMTg4MWQwM\
                DEtN2E2MS00N2IyLTk4ODQtYzVhY2QxNmJmZGZkIiwiaXNzIjoiaHR0cDovL2xvY2FsaG9zdDo2NTQzMi9hdXR\
                oL3JlYWxtcy90ZGYiLCJhdWQiOiJodHRwOi8vbG9jYWxob3N0OjY1NDMyL2F1dGgvcmVhbG1zL3RkZiIsInN1Y\
                iI6IjRhMjBiNDVkLWJhMDEtNGQzZi1iY2RhLTFjZWQzMDY0MWIyNSIsInR5cCI6IlJlZnJlc2giLCJhenAiOiJk\
                Y3ItdGVzdCIsInNlc3Npb25fc3RhdGUiOiI3NWZmODg3ZS05M2Q2LTRlMzktOGE5MS03ZGFlODQ5N2RjYjUiLCJ\
                zY29wZSI6ImVtYWlsIHByb2ZpbGUiLCJzaWQiOiI3NWZmODg3ZS05M2Q2LTRlMzktOGE5MS03ZGFlODQ5N2RjYj\
                UifQ.B-R44a6dPeF7ppqAnaBkgL6PcfUWetf9GuWqMq7OJTo"