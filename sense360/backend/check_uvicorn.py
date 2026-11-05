import importlib.util, sys
print('Executable:', sys.executable)
print('uvicorn available:', importlib.util.find_spec('uvicorn') is not None)
