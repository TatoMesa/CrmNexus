from django.db import migrations, models
class Migration(migrations.Migration):
    dependencies = [
        ('pedidos', '0002_remove_archivoadjunto_archivo_archivoadjunto_url'),
    ]
    operations = [
        migrations.AddField(
            model_name='pedido',
            name='numero',
            field=models.PositiveIntegerField(blank=True, null=True, unique=True, verbose_name='Número de pedido'),
        ),
    ]