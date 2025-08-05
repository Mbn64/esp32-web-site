import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ESP32Device, DeviceLog

class ESP32Consumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.device_id = None
        self.authenticated = False
        await self.accept()
        
    async def disconnect(self, close_code):
        if self.device_id:
            await self.channel_layer.group_discard(
                f"device_{self.device_id}",
                self.channel_name
            )
            await self.update_device_status(False)
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        
        if data['type'] == 'AUTH':
            await self.authenticate_device(data.get('api_key'))
        elif self.authenticated:
            await self.handle_device_message(data)
    
    async def authenticate_device(self, api_key):
        device = await self.get_device_by_api_key(api_key)
        if device and device.status == 'approved':
            self.device_id = device.id
            self.authenticated = True
            
            await self.channel_layer.group_add(
                f"device_{self.device_id}",
                self.channel_name
            )
            
            await self.update_device_status(True)
            
            await self.send(text_data=json.dumps({
                'type': 'AUTH_SUCCESS',
                'device_id': self.device_id
            }))
        else:
            await self.send(text_data=json.dumps({
                'type': 'AUTH_FAILED'
            }))
            await self.close()
    
    @database_sync_to_async
    def get_device_by_api_key(self, api_key):
        try:
            return ESP32Device.objects.get(api_key=api_key)
        except ESP32Device.DoesNotExist:
            return None
    
    @database_sync_to_async
    def update_device_status(self, is_online):
        if self.device_id:
            device = ESP32Device.objects.get(id=self.device_id)
            device.is_online = is_online
            if is_online:
                device.last_seen = timezone.now()
            device.save()