"""Paste a prepared script into Zotero's already-open Run JavaScript window."""
import sys
import time
from pathlib import Path
import win32api
import win32clipboard
import win32con
import win32gui
from PIL import ImageGrab


def press(key):
    win32api.keybd_event(key, 0, 0, 0)
    time.sleep(.04)
    win32api.keybd_event(key, 0, win32con.KEYEVENTF_KEYUP, 0)
    time.sleep(.04)


def chord(key):
    win32api.keybd_event(win32con.VK_CONTROL, 0, 0, 0)
    time.sleep(.04)
    press(key)
    win32api.keybd_event(win32con.VK_CONTROL, 0, win32con.KEYEVENTF_KEYUP, 0)
    time.sleep(.08)


code_path = Path(sys.argv[1]).resolve()
capture_path = Path(sys.argv[2]).resolve()
code = code_path.read_text(encoding='utf-8')
windows = []
win32gui.EnumWindows(lambda hwnd, _: windows.append(hwnd) if win32gui.IsWindowVisible(hwnd) and ('JavaScript' in win32gui.GetWindowText(hwnd)) else None, None)
if len(windows) != 1:
    mains = []
    win32gui.EnumWindows(lambda hwnd, _: mains.append(hwnd) if win32gui.IsWindowVisible(hwnd) and win32gui.GetWindowText(hwnd).endswith(' - Zotero') else None, None)
    if len(mains) != 1:
        raise RuntimeError(f'Expected one Zotero main window; found {mains}')
    win32gui.SetForegroundWindow(mains[0])
    time.sleep(.3)
    win32api.keybd_event(win32con.VK_MENU, 0, 0, 0)
    press(ord('T'))
    win32api.keybd_event(win32con.VK_MENU, 0, win32con.KEYEVENTF_KEYUP, 0)
    time.sleep(.2)
    for _ in range(3):
        press(win32con.VK_DOWN)
    press(win32con.VK_RIGHT)
    press(win32con.VK_DOWN)
    press(win32con.VK_RETURN)
    time.sleep(.5)
    windows = []
    win32gui.EnumWindows(lambda hwnd, _: windows.append(hwnd) if win32gui.IsWindowVisible(hwnd) and ('JavaScript' in win32gui.GetWindowText(hwnd)) else None, None)
    if len(windows) != 1:
        raise RuntimeError(f'Could not open Zotero JavaScript window; found {windows}')
win32clipboard.OpenClipboard()
win32clipboard.EmptyClipboard()
win32clipboard.SetClipboardText(code, win32con.CF_UNICODETEXT)
win32clipboard.CloseClipboard()
win32gui.SetForegroundWindow(windows[0])
time.sleep(.4)
win32api.SetCursorPos((620, 260))
win32api.mouse_event(win32con.MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
time.sleep(.08)
win32api.mouse_event(win32con.MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
chord(ord('A'))
chord(ord('V'))
chord(ord('R'))
time.sleep(float(sys.argv[3]) if len(sys.argv) > 3 else .8)
ImageGrab.grab().save(capture_path)
print(f'Ran {code_path.name}; screenshot {capture_path}')
