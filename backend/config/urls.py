from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from pedidos.views import PedidoViewSet, login, refresh_token, subir_archivo, eliminar_archivo

router = DefaultRouter()
router.register(r'pedidos', PedidoViewSet, basename='pedido')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/login/', login),
    path('api/auth/refresh/', refresh_token),
    path('api/', include(router.urls)),
    path('api/pedidos/<uuid:pedido_id>/archivos/', subir_archivo),
    path('api/archivos/<int:archivo_id>/', eliminar_archivo),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)