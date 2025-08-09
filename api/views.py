from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.utils import timezone
from accounts.models import ESP32Device
import json

# Simple in-memory command queue (renamed to avoid conflict)
device_command_queue = {}

@csrf_exempt
@require_http_methods(["POST"])
def device_status(request):
    """دریافت وضعیت از ESP32"""
    try:
        # احراز هویت API Key
        api_key = request.headers.get('X-API-Key') or request.headers.get('Authorization', '').replace('Bearer ', '')
        
        if not api_key:
            return JsonResponse({'error': 'API Key required'}, status=401)
        
        try:
            device = ESP32Device.objects.get(api_key=api_key, status='approved')
        except ESP32Device.DoesNotExist:
            return JsonResponse({'error': 'Invalid API Key'}, status=401)
        
        # پردازش داده‌ها
        data = json.loads(request.body)
        
        # بروزرسانی وضعیت دستگاه
        device.is_online = True
        device.last_seen = timezone.now()
        device.ip_address = data.get('ip_address', request.META.get('REMOTE_ADDR'))
        device.save()
        
        # لاگ در کنسول
        print(f"📡 Status from {device.name}: LED={data.get('led_state')}, RSSI={data.get('rssi')}")
        
        return JsonResponse({
            'status': 'success',
            'message': 'Status received',
            'timestamp': timezone.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Error in device_status: {e}")
        return JsonResponse({'error': 'Internal error'}, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def device_commands(request):
    """دریافت دستورات برای ESP32"""
    try:
        # احراز هویت API Key
        api_key = request.headers.get('X-API-Key') or request.headers.get('Authorization', '').replace('Bearer ', '')
        
        if not api_key:
            return JsonResponse({'error': 'API Key required'}, status=401)
        
        try:
            device = ESP32Device.objects.get(api_key=api_key, status='approved')
        except ESP32Device.DoesNotExist:
            return JsonResponse({'error': 'Invalid API Key'}, status=401)
        
        # چک کردن دستورات در صف
        device_id = str(device.id)
        if device_id in device_command_queue and device_command_queue[device_id]:
            command = device_command_queue[device_id].pop(0)  # گرفتن اولین دستور
            print(f"📤 Sending command to {device.name}: {command}")
            return JsonResponse(command)
        
        return HttpResponse(status=204)  # No commands
        
    except Exception as e:
        print(f"❌ Error in device_commands: {e}")
        return JsonResponse({'error': 'Internal error'}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def device_confirm(request):
    """تایید اجرای دستور"""
    try:
        # احراز هویت API Key
        api_key = request.headers.get('X-API-Key')
        
        if not api_key:
            return JsonResponse({'error': 'API Key required'}, status=401)
        
        try:
            device = ESP32Device.objects.get(api_key=api_key, status='approved')
        except ESP32Device.DoesNotExist:
            return JsonResponse({'error': 'Invalid API Key'}, status=401)
        
        data = json.loads(request.body)
        command_id = data.get('command_id')
        status = data.get('status')
        
        print(f"✅ Command {command_id} {status} on {device.name}")
        
        return JsonResponse({'status': 'confirmed'})
        
    except Exception as e:
        print(f"❌ Error in device_confirm: {e}")
        return JsonResponse({'error': 'Internal error'}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def device_control(request, device_id):
    """کنترل دستگاه از وب"""
    try:
        # پیدا کردن دستگاه
        device = ESP32Device.objects.get(id=device_id, user=request.user, status='approved')
        
        data = json.loads(request.body)
        action = data.get('action')
        value = data.get('value')
        
        # ساخت دستور
        command = {
            'command_id': f"cmd_{int(timezone.now().timestamp())}",
            'action': f"led_{value}" if action == 'led' else action,
            'timestamp': timezone.now().isoformat()
        }
        
        # اضافه کردن به صف دستورات
        device_id_str = str(device.id)
        if device_id_str not in device_command_queue:
            device_command_queue[device_id_str] = []
        
        device_command_queue[device_id_str].append(command)
        
        print(f"🎛️ Command queued for {device.name}: {command}")
        
        return JsonResponse({
            'success': True,
            'message': f'Command sent: {action} {value}',
            'command_id': command['command_id']
        })
        
    except ESP32Device.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Device not found'}, status=404)
    except Exception as e:
        print(f"❌ Error in device_control: {e}")
        return JsonResponse({'success': False, 'message': 'Internal error'}, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def device_status_view(request, device_id):
    """نمایش وضعیت دستگاه برای وب"""
    try:
        device = ESP32Device.objects.get(id=device_id, user=request.user, status='approved')
        
        return JsonResponse({
            'success': True,
            'device_name': device.name,
            'is_online': device.is_online,
            'last_seen': device.last_seen.isoformat() if device.last_seen else None,
            'ip_address': device.ip_address,
        })
        
    except ESP32Device.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Device not found'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'message': 'Internal error'}, status=500)
